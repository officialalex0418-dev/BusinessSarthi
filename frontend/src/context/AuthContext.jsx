import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setAccessToken, getAccessToken } from '@/api/client';
import { Device } from '@capacitor/device';

const AuthContext = createContext(null);

export function syncFcmToken() {
  const fcmToken = localStorage.getItem('fcm_token');
  if (fcmToken) {
    api.patch('/auth/fcm-token', { token: fcmToken }).catch(err => {
      console.warn('[FCM] Token sync warning:', err?.response?.data?.message || err.message);
    });
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync FCM Token whenever user session changes or activates
  useEffect(() => {
    if (user?._id) {
      syncFcmToken();
    }
  }, [user?._id]);

  useEffect(() => {
    (async () => {
      const token = getAccessToken();

      try {
        // Parallel load: Branding + User Profile
        const [settingsRes, userRes] = await Promise.all([
          api.get('/auth/settings'),
          token ? api.get('/auth/me') : Promise.resolve({ data: { data: { user: null } } })
        ]);

        if (settingsRes?.data?.success) setSettings(settingsRes.data.data);
        if (userRes?.data?.success) {
          setUser(userRes.data.data.user);
          syncFcmToken();
        }

      } catch (e) {
        console.warn('Initialization failed', e);
        // Only clear tokens if the server explicitly rejects them (401/403)
        // Do NOT clear on network errors or 5xx server errors, as that causes accidental logouts
        const status = e.response?.status;
        if (token && (status === 401 || status === 403)) {
          setAccessToken(null);
          localStorage.removeItem('bs_refresh');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email, password) => {
    let deviceId = localStorage.getItem('bs_device_id');
    let deviceInfo = null;

    try {
      const [idInfo, info] = await Promise.all([
        Device.getId(),
        Device.getInfo()
      ]);
      deviceId = idInfo.identifier;
      deviceInfo = {
        name: info.name,
        model: info.model,
        platform: info.platform,
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
        isVirtual: info.isVirtual,
      };
      localStorage.setItem('bs_device_id', deviceId);
    } catch (e) {
      if (!deviceId) {
        deviceId = `WEB-${Math.random().toString(36).substring(2, 15)}`;
        localStorage.setItem('bs_device_id', deviceId);
      }
      deviceInfo = { platform: 'web', name: 'Browser' };
    }

    const { data } = await api.post('/auth/login', { email, password, deviceId, deviceInfo });
    setAccessToken(data.data.accessToken);
    localStorage.setItem('bs_refresh', data.data.refreshToken);
    setUser(data.data.user);
    syncFcmToken();
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    // 1. Check if user is staff and currently checked in for auto-checkout
    if (user?.role === 'STAFF') {
      try {
        const { data: att } = await api.get('/attendance/me');
        if (att.data.today?.checkIn?.time && !att.data.today?.checkOut?.time) {
          // Perform automatic checkout on manual logout
          await api.post('/attendance/check-out', {
            auto: true,
            reason: 'MANUAL_LOGOUT_AUTO_CHECKOUT'
          });
        }
      } catch (e) {
        console.warn('Auto-checkout failed during logout', e);
      }
    }

    // 2. Perform regular logout
    try {
      await api.post('/auth/logout', { refreshToken: localStorage.getItem('bs_refresh') });
    } catch {}

    setAccessToken(null);
    localStorage.removeItem('bs_refresh');
    setUser(null);
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.data.user);
    } catch (e) {
      console.error('Failed to refresh user data', e);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, settings, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
