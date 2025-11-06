"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import type { UserPreferences } from "@/types";

type Accent = 'green' | 'blue' | 'violet' | 'amber' | 'rose' | 'teal';

type ThemeSettings = {
  accent: Accent;
  radius: number;
  setAccent: (a: Accent) => void;
  setRadius: (r: number) => void;
  setMode: (m: 'light' | 'dark' | 'system') => void;
};

const ThemeSettingsContext = createContext<ThemeSettings | undefined>(undefined);

const ACCENTS: Record<Accent, string> = {
  green: '#16a34a',
  blue: '#2563eb',
  violet: '#7c3aed',
  amber: '#f59e0b',
  rose: '#e11d48',
  teal: '#0d9488',
};

export function ThemeSettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUserPreferences } = useAuth();
  const { setTheme } = useTheme();
  const [accent, setAccentState] = useState<Accent>('green');
  const [radius, setRadiusState] = useState<number>(8);

  // hydrate from user prefs
  useEffect(() => {
    const a = (user?.preferences as UserPreferences | undefined)?.appearance?.accent as Accent | undefined;
    const r = (user?.preferences as UserPreferences | undefined)?.appearance?.radius as number | undefined;
    if (a) setAccentState(a);
    if (r) setRadiusState(r);
  }, [user?.id, user?.preferences]);

  // Apply only non-color tokens here to avoid overriding admin theme.
  // Admin-managed colors (primary, ring, etc.) are applied by GlobalThemeProvider.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--radius', `${radius / 16}rem`);
  }, [radius]);

  const setAccent = (a: Accent) => {
    setAccentState(a);
    if (user) updateUserPreferences({ appearance: { accent: a, radius } });
  };

  const setRadius = (r: number) => {
    setRadiusState(r);
    if (user) updateUserPreferences({ appearance: { accent, radius: r } });
  };

  const setMode = (m: 'light' | 'dark' | 'system') => {
    setTheme(m);
    if (user) updateUserPreferences({ theme: m });
  };

  const value = { accent, radius, setAccent, setRadius, setMode };

  return (
    <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>
  );
}

export function useThemeSettings() {
  const ctx = useContext(ThemeSettingsContext);
  if (!ctx) throw new Error('useThemeSettings must be used within ThemeSettingsProvider');
  return ctx;
}




