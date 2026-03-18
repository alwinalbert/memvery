'use client';

import { useEffect } from 'react';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load theme preference on mount
    const savedPreferences = localStorage.getItem('memvery_preferences');
    if (savedPreferences) {
      const prefs = JSON.parse(savedPreferences);
      if (prefs.darkMode !== false) {
        document.documentElement.classList.add('dark');
        document.body.style.background = '#0a0a0a';
        document.body.style.color = '#ededed';
      } else {
        document.documentElement.classList.remove('dark');
        document.body.style.background = '#ffffff';
        document.body.style.color = '#171717';
      }
    } else {
      // Default to dark mode
      document.documentElement.classList.add('dark');
      document.body.style.background = '#0a0a0a';
      document.body.style.color = '#ededed';
    }
  }, []);

  return <>{children}</>;
}
