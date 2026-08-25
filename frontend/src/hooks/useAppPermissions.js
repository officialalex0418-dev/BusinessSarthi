import { useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Network } from '@capacitor/network';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export function useAppPermissions() {
  const isNative = Capacitor.isNativePlatform();

  const requestAllPermissions = useCallback(async () => {
    if (!isNative) return true;

    try {
      // Small helper for sequential requests
      const delay = () => new Promise(r => setTimeout(r, 500));

      // 1. Notifications (High priority for WhatsApp-style)
      await LocalNotifications.requestPermissions();
      await delay();

      // 2. Geolocation (Fine/Coarse)
      await Geolocation.requestPermissions();
      await delay();

      // 3. Camera
      await Camera.requestPermissions();
      await delay();

      // 4. Storage
      await Filesystem.requestPermissions();

      // Note: Battery optimization and background activity are best managed
      // by the background-geolocation plugin or by guiding the user to settings.

      return true;
    } catch (e) {
      console.error('Permission requesting error:', e);
      return false;
    }
  }, [isNative]);

  const requestLocation = useCallback(async () => {
    if (!isNative) return true;
    try {
      const status = await Geolocation.requestPermissions();
      return status.location === 'granted';
    } catch (e) {
      return false;
    }
  }, [isNative]);

  const requestCamera = useCallback(async () => {
    if (!isNative) return true;
    try {
      const status = await Camera.requestPermissions();
      // On some platforms, 'camera' is enough for photos, on others 'photos' is separate.
      // For picking from gallery or taking photo, we usually need at least one of these.
      return status.camera === 'granted' || status.photos === 'granted';
    } catch (e) {
      return false;
    }
  }, [isNative]);

  const checkConnectivity = useCallback(async () => {
    const status = await Network.getStatus();
    return status.connected;
  }, []);

  return { requestLocation, requestCamera, requestAllPermissions, checkConnectivity };
}
