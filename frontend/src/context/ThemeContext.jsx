import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/api/client';
import { fixFileUrl } from '@/lib/utils';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('bs_theme') === 'dark');
  const [branding, setBranding] = useState({
    appName: 'Business Sarthi',
    logoUrl: '/logo.png',
    tagline: 'Driving Business Forward'
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('bs_theme', dark ? 'dark' : 'light');

    // Manage Status Bar Appearance on Mobile
    if (Capacitor.isNativePlatform()) {
      try {
        StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
        StatusBar.setStyle({
          style: dark ? Style.Dark : Style.Light
        }).catch(() => {});

        // Ensure background is transparent to allow our header blur to show through
        StatusBar.setBackgroundColor({
          color: dark ? '#00000000' : '#ffffffff'
        }).catch(() => {});
      } catch (e) {}
    }
  }, [dark]);

  useEffect(() => {
    api.get('/auth/settings').then(({ data }) => {
      if (data?.data?.branding) {
        setBranding({
          ...data.data.branding,
          logoUrl: fixFileUrl(data.data.branding.logoUrl)
        });
      }
    }).catch((err) => {
       console.warn('[THEME] Failed to load platform branding', err.message);
    });
  }, []);

  const updateBranding = (newBranding) => {
    setBranding(prev => ({ ...prev, ...newBranding }));
  };

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d), branding, setBranding: updateBranding }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
