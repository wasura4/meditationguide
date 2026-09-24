'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { isLanguage, LANGUAGE_STORAGE_KEY, translate, type Language } from '@/i18n/runtime';
export type { Language } from '@/i18n/runtime';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}

export function LanguageProvider({ children, initialLanguage }: { children: ReactNode; initialLanguage?: Language }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage || 'si');
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const setLanguage = useCallback((next: Language) => {
    if (!isLanguage(next)) return;
    setLanguageState(next);
    document.documentElement.lang = next;
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* Storage may be disabled. */ }
    try { document.cookie = `lang=${next}; path=/; max-age=31536000; SameSite=Lax`; } catch { /* In-memory selection still works. */ }
  }, []);

  useEffect(() => {
    let saved: unknown;
    try { saved = localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch { /* Use server preference. */ }
    setLanguage(initialLanguage || (isLanguage(saved) ? saved : 'si'));
  }, [initialLanguage, setLanguage]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY && isLanguage(event.newValue)) setLanguage(event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [setLanguage]);

  useEffect(() => {
    let disposed = false;
    let request = 0;
    const refresh = async () => {
      const current = ++request;
      try {
        const { LanguageService } = await import('@/lib/languageService');
        const rows = await LanguageService.getAllTranslations();
        if (!disposed && current === request) setOverrides(Object.fromEntries(rows.map(row => [row.key, row.sinhala])));
      } catch { /* Bundled translations remain available offline. */ }
    };
    void refresh();
    window.addEventListener('nirvanaya-translations-updated', refresh);
    window.addEventListener('online', refresh);
    return () => {
      disposed = true;
      window.removeEventListener('nirvanaya-translations-updated', refresh);
      window.removeEventListener('online', refresh);
    };
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>) => translate(language, key, params, overrides), [language, overrides]);
  const value = useMemo(() => ({ language, setLanguage, t, isLoading: false }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
