import { useEffect, useRef, useState, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { LocalNotifications } from '@capacitor/local-notifications';
import { registerPlugin } from '@capacitor/core';
import { api } from '@/api/client';
import { useSocket, useSocketEvent } from '@/context/SocketContext';
import { localDb } from '@/lib/storage';

const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');

const ALERT_SOUND_BASE64 = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YT1vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT19vT18=';

export function useLocationTracker(enabled = true) {
  const [status, setStatus] = useState('idle');
  const [intervalMinutes, setIntervalMinutes] = useState(null);
  const [lastPing, setLastPing] = useState(null);
  const [isAlerting, setIsAlerting] = useState(false);

  const { socket, connected } = useSocket() || {};
  const lastPersistentGpsAtRef = useRef(null);
  const uploadInFlightRef = useRef(false);

  const persistentTimerRef = useRef(null);
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

    if (reason === 'GPS_OFF') {
      notifyUser('GPS Turned Off', 'Please turn on GPS/Location Services to continue tracking your shift.');
    } else if (reason === 'NO_INTERNET') {
      notifyUser('Internet Disconnected', 'Please enable Mobile Data or Wi-Fi to sync your tracking data.');
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(ALERT_SOUND_BASE64);
      audioRef.current.loop = true;
    }
    audioRef.current.play().catch(() => {});

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
          ongoing: true,
          sticky: true,
          channelId: 'bs_alerts',
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
      const battery = await Device.getBatteryInfo();
      const isNative = info.platform === 'android' || info.platform === 'ios';
      if (!isNative) return null;

      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });

        gpsOffStartTimeRef.current = null;
        if (checkOutTimerRef.current) {
          clearTimeout(checkOutTimerRef.current);
          checkOutTimerRef.current = null;
        }

        stopAlert();

        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          batteryLevel: Math.round((battery.batteryLevel || 0) * 100),
          recordedAt: new Date(pos.timestamp).toISOString(),
          deviceInfo: {
            platform: info.platform,
            model: info.model,
            osVersion: info.osVersion,
          },
          source: 'BACKGROUND',
        };
      } catch (geoErr) {
        if (!gpsOffStartTimeRef.current) {
          gpsOffStartTimeRef.current = Date.now();
          playAlert('GPS_OFF');

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
    const queue = await localDb.getAllLocations();
    if (!queue.length) return;
    try {
      await api.post('/locations', { pings: queue });
      await localDb.clearLocations();
    } catch { /* keep queued */ }
  }, []);

  const ping = useCallback(async (source = 'BACKGROUND', preCaptured = null) => {
    const now = Date.now();
    const intervalMs = (intervalMinutes || 60) * 60000;

    const isPersistent = ['BACKGROUND', 'MANUAL'].includes(source);
    if (isPersistent && lastPersistentGpsAtRef.current) {
       if (now - lastPersistentGpsAtRef.current < intervalMs) return;
    }

    if (uploadInFlightRef.current && source !== 'LIVE_REFRESH') return;

    try {
      const point = preCaptured || await capture();
      if (!point) return;
      point.source = source;

      if (source === 'LIVE_REFRESH') {
        if (connected && socket) {
          socket.emit('staff:location:live', {
             lat: point.latitude,
             lng: point.longitude,
             accuracy: point.accuracy,
             batteryLevel: point.batteryLevel,
             recordedAt: point.recordedAt
          });
        }
        return;
      }

      uploadInFlightRef.current = true;
      try {
        await flush();
        await api.post('/locations', point);
        lastPersistentGpsAtRef.current = Date.now();
        setLastPing(new Date());
      } catch (err) {
        await localDb.addLocation(point);
      } finally {
        uploadInFlightRef.current = false;
      }
    } catch (e) {
       console.error('Location tracking failed:', e.message);
    }
  }, [capture, flush, intervalMinutes, socket, connected]);

  useSocketEvent('location:force_update', useCallback(() => {
    if (enabled) {
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
      let minutes = 60;
      try {
        const { data } = await api.get('/locations/config');
        if (!data.data.enabled) return;
        minutes = data.data.packageInterval || data.data.intervalMinutes || 60;
      } catch { return; }
      if (cancelled) return;

      setIntervalMinutes(minutes);
      setStatus('active');

      try {
        await BackgroundGeolocation.addWatcher(
          {
            id: 'bs_watcher',
            backgroundTitle: 'Business Sarthi Tracking',
            backgroundMessage: 'Shift active. Tracking for route and heatmap...',
            requestPermissions: true,
            stale: false,
            distanceFilter: 50,
          },
          async (pos, err) => {
            if (err) return;
            if (pos) {
               const info = await Device.getInfo();
               const battery = await Device.getBatteryInfo();
               const point = {
                  latitude: pos.latitude,
                  longitude: pos.longitude,
                  accuracy: pos.accuracy,
                  batteryLevel: Math.round((battery.batteryLevel || 0) * 100),
                  recordedAt: new Date(pos.time).toISOString(),
                  deviceInfo: {
                    platform: info.platform,
                    model: info.model,
                    osVersion: info.osVersion,
                  },
                  source: 'BACKGROUND',
               };
               ping('BACKGROUND', point);
            }
          }
        );
      } catch (e) {
        console.error('Failed to start native background watcher:', e);
      }

      ping();
      persistentTimerRef.current = setInterval(ping, minutes * 60 * 1000);

      const onVisible = () => { if (document.visibilityState === 'visible') ping(); };
      document.addEventListener('visibilitychange', onVisible);

      const onNetChange = (s) => {
        if (s.connected) {
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
      if (persistentTimerRef.current) clearInterval(persistentTimerRef.current);
      stopAlert();
    };
  }, [enabled, ping, flush, playAlert, stopAlert, updateTrackingNotification]);

  return { status, intervalMinutes, lastPing, isAlerting, ping };
}
