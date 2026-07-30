import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/api/client';

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
  }, [dark]);

  useEffect(() => {
    api.get('/auth/settings').then(({ data }) => {
      if (data.data.branding) {
        const { fixFileUrl } = import('@/lib/utils');
        import('@/lib/utils').then(({ fixFileUrl }) => {
            setBranding({
              ...data.data.branding,
              logoUrl: fixFileUrl(data.data.branding.logoUrl)
            });
        });
      }
    }).catch(() => {});
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
