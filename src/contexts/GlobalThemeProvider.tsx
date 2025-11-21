'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AdminTheme, DEFAULT_ADMIN_THEME, getAdminTheme } from '@/lib/appSettingsService';

type GlobalThemeContextValue = {
  theme: AdminTheme;
  loaded: boolean;
};

const GlobalThemeContext = createContext<GlobalThemeContextValue>({ theme: DEFAULT_ADMIN_THEME, loaded: false });

export function useGlobalTheme() {
  return useContext(GlobalThemeContext);
}

function applyThemeToCSS(theme: AdminTheme) {
  if (typeof document === 'undefined') return;
  const r = document.documentElement;
  // Only apply accent/brand colors from admin theme
  // Base theme colors (background, foreground, muted, border, input) are controlled by next-themes + globals.css
  const map: Record<string, string> = {
    '--primary': theme.primary,
    '--secondary': theme.secondary,
    '--accent': theme.accent,
    '--accent-foreground': theme.accentForeground,
    '--ring': theme.ring,
    '--header-bg': theme.headerBg || DEFAULT_ADMIN_THEME.headerBg!,
    '--brand-grad-from': theme.brandGradFrom || DEFAULT_ADMIN_THEME.brandGradFrom!,
    '--brand-grad-to': theme.brandGradTo || DEFAULT_ADMIN_THEME.brandGradTo!,
    // DO NOT override: --background, --foreground, --muted, --muted-foreground, --border, --input
    // These are managed by next-themes + .dark class in globals.css
  };
  Object.entries(map).forEach(([k, v]) => r.style.setProperty(k, v));
}

export const GlobalThemeProvider: React.FC<{ children: React.ReactNode } > = ({ children }) => {
  const [theme, setTheme] = useState<AdminTheme>(DEFAULT_ADMIN_THEME);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const t = await getAdminTheme();
      if (!alive) return;
      setTheme(t);
      applyThemeToCSS(t);
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  const value = useMemo(() => ({ theme, loaded }), [theme, loaded]);

  return (
    <GlobalThemeContext.Provider value={value}>{children}</GlobalThemeContext.Provider>
  );
};
