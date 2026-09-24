'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AdminTheme, DEFAULT_ADMIN_THEME, subscribeAdminTheme } from '@/lib/appSettingsService';

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
  // Admin base colors apply to light mode; dark mode retains its readable palette.
  const map: Record<string, string> = {
    '--primary': theme.primary,
    '--secondary': theme.secondary,
    '--accent': theme.accent,
    '--accent-foreground': theme.accentForeground,
    '--ring': theme.ring,
    '--header-bg': theme.headerBg || DEFAULT_ADMIN_THEME.headerBg!,
    '--brand-grad-from': theme.brandGradFrom || DEFAULT_ADMIN_THEME.brandGradFrom!,
    '--brand-grad-to': theme.brandGradTo || DEFAULT_ADMIN_THEME.brandGradTo!,
    '--admin-background': theme.background,
    '--admin-foreground': theme.foreground,
    '--admin-muted': theme.muted,
    '--admin-muted-foreground': theme.mutedForeground,
    '--admin-border': theme.border,
    '--admin-input': theme.input,
  };
  Object.entries(map).forEach(([k, v]) => r.style.setProperty(k, v));
}

export const GlobalThemeProvider: React.FC<{ children: React.ReactNode } > = ({ children }) => {
  const [theme, setTheme] = useState<AdminTheme>(DEFAULT_ADMIN_THEME);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    return subscribeAdminTheme(t => {
      setTheme(t);
      applyThemeToCSS(t);
      setLoaded(true);
    });
  }, []);

  const value = useMemo(() => ({ theme, loaded }), [theme, loaded]);

  return (
    <GlobalThemeContext.Provider value={value}>{children}</GlobalThemeContext.Provider>
  );
};
