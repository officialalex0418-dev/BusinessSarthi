import { useEffect, useRef, useState, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { api } from '@/api/client';
import { useSocketEvent } from '@/context/SocketContext';

const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');

const QUEUE_KEY = 'bs_location_queue';
// A simple short high-pitched beep sound in base64
const ALERT_SOUND_BASE64 = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YT1vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT18=';

function readQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
}
function writeQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-500))); // Store more points
}

export function useLocationTracker(enabled = true) {
  const [status, setStatus] = useState('idle');
  const [intervalMinutes, setIntervalMinutes] = useState(null);
  const [lastPing, setLastPing] = useState(null);
  const [isAlerting, setIsAlerting] = useState(false);
  const timerRef = useRef(null);
  const heartbeatRef = useRef(null);
  const audioRef = useRef(null);
  const alertTimerRef = useRef(null);
  const gpsOffStartTimeRef = useRef(null);
  const checkOutTimerRef = useRef(null);

  const notifyUser = useCallback(async (title, message) => {
    await LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Math.random() * 1000),
        title,
        body: message,
        schedule: { at: new Date(Date.now() + 100) },
        sound: 'beep.wav',
        channelId: 'bs_alerts',
      }]
    }).catch(() => {});
  }, []);

  const playAlert = useCallback((reason) => {
    if (isAlerting) return;
    setIsAlerting(true);

    // Specific notification based on reason
    if (reason === 'GPS_OFF') {
      notifyUser('GPS Turned Off', 'Please turn on GPS/Location Services to continue tracking your shift.');
    } else if (reason === 'NO_INTERNET') {
      notifyUser('Internet Disconnected', 'Please enable Mobile Data or Wi-Fi to sync your tracking data.');
    }

    // Play sound
    if (!audioRef.current) {
      audioRef.current = new Audio(ALERT_SOUND_BASE64);
      audioRef.current.loop = true;
    }
    audioRef.current.play().catch(() => {});

    // Stop after 30 seconds
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => {
      stopAlert();
    }, 30000);
  }, [isAlerting, notifyUser]);

  const stopAlert = useCallback(() => {
    setIsAlerting(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
  }, []);

  const updateTrackingNotification = useCallback(async (isActive) => {
    if (isActive) {
      await LocalNotifications.schedule({
        notifications: [{
          id: 999,
          title: 'Business Sarthi Tracking',
          body: 'Your shift is active and location is being tracked.',
          ongoing: true, // Makes it a foreground service notification
          sticky: true,
          channelId: 'bs_alerts',
          smallIcon: 'ic_stat_name', // Needs to exist in android res
        }]
      }).catch(() => {});
    } else {
      await LocalNotifications.cancel({ notifications: [{ id: 999 }] }).catch(() => {});
    }
  }, []);

  const capture = useCallback(async () => {
    try {
      const net = await Network.getStatus();
      if (!net.connected) {
        playAlert('NO_INTERNET');
        throw new Error('NO_INTERNET');
      }

      const info = await Device.getInfo();
      const isNative = info.platform === 'android' || info.platform === 'ios';
      if (!isNative) return null;

      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });

        // GPS is ON - Reset 45-min timer
        gpsOffStartTimeRef.current = null;
        if (checkOutTimerRef.current) {
          clearTimeout(checkOutTimerRef.current);
          checkOutTimerRef.current = null;
        }

        stopAlert(); // Location and Internet are fine

        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          recordedAt: new Date(pos.timestamp).toISOString(),
          deviceInfo: {
            platform: info.platform,
            model: info.model,
            osVersion: info.osVersion,
          },
          source: 'BACKGROUND',
        };
      } catch (geoErr) {
        // GPS is OFF or Unreachable
        if (!gpsOffStartTimeRef.current) {
          gpsOffStartTimeRef.current = Date.now();
          playAlert('GPS_OFF');

          // Start 45-minute countdown for auto-checkout
          const FORTY_FIVE_MINS = 45 * 60 * 1000;
          checkOutTimerRef.current = setTimeout(async () => {
            try {
              await api.post('/attendance/check-out', {
                auto: true,
                reason: 'GPS_OFF_45MIN_TIMEOUT'
              });
              notifyUser('Auto Checkout', 'You have been automatically checked out due to GPS being disabled for 45 minutes.');
            } catch (e) {
              console.error('Auto-checkout failed', e);
            }
          }, FORTY_FIVE_MINS);
        }
        throw geoErr;
      }
    } catch (e) {
      if (e.message === 'location_denied' || e.code === 1) {
        setStatus('denied');
        playAlert('GPS_OFF');
      } else if (e.message === 'POSITION_UNAVAILABLE' || e.code === 2) {
        playAlert('GPS_OFF');
      }
      throw e;
    }
  }, [playAlert, stopAlert, notifyUser]);

  const flush = useCallback(async () => {
    const queue = readQueue();
    if (!queue.length) return;
    try {
      await api.post('/locations', { pings: queue });
      writeQueue([]);
    } catch { /* keep queued */ }
  }, []);

  const ping = useCallback(async (source = 'BACKGROUND') => {
    try {
      const point = await capture();
      if (!point) return;
      point.source = source;
      try {
        // Only flush/update lastPing if it's a persistent ping
        if (source !== 'LIVE_REFRESH') await flush();

        await api.post('/locations', point);

        if (source !== 'LIVE_REFRESH') {
          setLastPing(new Date());
        }
      } catch {
        // Only queue persistent points
        if (source !== 'LIVE_REFRESH') {
          writeQueue([...readQueue(), point]);
        }
      }
    } catch (e) {
       console.error('Ping failed:', e.message);
    }
  }, [capture, flush]);

  // Handle server-side requests for immediate refresh
  useSocketEvent('location:force_update', useCallback(() => {
    if (enabled) {
      console.log('Force refresh requested via socket');
      ping('LIVE_REFRESH');
    }
  }, [enabled, ping]));

  useEffect(() => {
    if (!enabled) {
      stopAlert();
      updateTrackingNotification(false);
      BackgroundGeolocation.removeWatcher({ id: 'bs_watcher' }).catch(() => {});
      return;
    }

    updateTrackingNotification(true);
    let cancelled = false;

    (async () => {
      let minutes = 1;
      try {
        const { data } = await api.get('/locations/config');
        if (!data.data.enabled) return;
        minutes = data.data.intervalMinutes || 1;
      } catch { return; }
      if (cancelled) return;

      setIntervalMinutes(minutes);
      setStatus('active');

      // Start the native background watcher
      // This is what keeps the process alive even if UI is closed
      try {
        await BackgroundGeolocation.addWatcher(
          {
            id: 'bs_watcher',
            backgroundTitle: 'Business Sarthi Tracking',
            backgroundMessage: 'Shift active. Recording location in background...',
            requestPermissions: true,
            stale: false,
            distanceFilter: 0, // Report every small movement to keep connection alive
          },
          async (pos, err) => {
            if (err) {
              console.error('Background geolocation error:', err);
              return;
            }
            if (pos) {
               const info = await Device.getInfo();
               const point = {
                  latitude: pos.latitude,
                  longitude: pos.longitude,
                  accuracy: pos.accuracy,
                  recordedAt: new Date(pos.time).toISOString(),
                  deviceInfo: {
                    platform: info.platform,
                    model: info.model,
                    osVersion: info.osVersion,
                  },
                  source: 'BACKGROUND_WATCHER',
               };
               try {
                  // Flush offline queue first to maintain order
                  const queue = readQueue();
                  if (queue.length > 0) {
                     await api.post('/locations', { pings: queue });
                     writeQueue([]);
                  }
                  await api.post('/locations', point);
                  setLastPing(new Date());
               } catch {
                  writeQueue([...readQueue(), point]);
               }
            }
          }
        );
      } catch (e) {
        console.error('Failed to start native background watcher:', e);
      }

      // Foreground Intervals
      ping();
      timerRef.current = setInterval(ping, minutes * 60 * 1000);
      heartbeatRef.current = setInterval(ping, 10 * 60 * 1000); // 10 min heartbeat

      const onVisible = () => { if (document.visibilityState === 'visible') ping(); };
      document.addEventListener('visibilitychange', onVisible);

      const onNetChange = (status) => {
        if (status.connected) {
          stopAlert();
          flush();
        } else {
          playAlert('NO_INTERNET');
        }
      };
      const netHandler = Network.addListener('networkStatusChange', onNetChange);

      return () => {
        document.removeEventListener('visibilitychange', onVisible);
        netHandler.remove();
      };
    })();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      // Remove explicit watcher termination on unmount.
      // This allows the native service to stay alive if app UI is swiped away.
      // termination only happens on explicit logout or checkout.
      stopAlert();
    };
  }, [enabled, ping, flush, playAlert, stopAlert, updateTrackingNotification]);

  return { status, intervalMinutes, lastPing, isAlerting, ping };
}
