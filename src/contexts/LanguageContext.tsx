'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'si';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface Translations {
  [key: string]: unknown;
}

// Helper function to merge translations
const mergeTranslations = (base: Record<string, unknown>, translations: Map<string, string>, prefix = ''): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const key in base) {
    if (base.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof base[key] === 'object' && base[key] !== null && !Array.isArray(base[key])) {
        result[key] = mergeTranslations(base[key] as Record<string, unknown>, translations, fullKey);
      } else {
        result[key] = translations.get(fullKey) || base[key];
      }
    }
  }
  return result;
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations for the selected language
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        setIsLoading(true);
        
        if (language === 'si') {
          // Load Sinhala translations from Firebase
          try {
            const { LanguageService } = await import('@/lib/languageService');
            const dbTranslations = await LanguageService.getAllTranslations();
            
            // Load base English translations
            const enModule = await import('@/i18n/locales/en/common.json');
            const enTranslations = enModule.default;
            
            // Create a map of translations
            const translationMap = new Map<string, string>();
            dbTranslations.forEach(t => {
              if (t.sinhala) {
                translationMap.set(t.key, t.sinhala);
              }
            });
            
            // Merge English and Sinhala translations
            const mergedTranslations = mergeTranslations(enTranslations, translationMap);
            setTranslations(mergedTranslations);
          } catch (error) {
            console.error('Failed to load Firebase translations:', error);
            // Fallback to static Sinhala translations
            const translationModule = await import(`@/i18n/locales/${language}/common.json`);
            setTranslations(translationModule.default);
          }
        } else {
          // Load English translations
          const translationModule = await import(`@/i18n/locales/${language}/common.json`);
          setTranslations(translationModule.default);
        }
      } catch (error) {
        console.error(`Failed to load ${language} translations:`, error);
        // Fallback to English
        const fallbackModule = await import('@/i18n/locales/en/common.json');
        setTranslations(fallbackModule.default);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  // Get translation value by key path (e.g., "dashboard.title")
  const getTranslation = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: unknown = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return key if translation not found
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Replace parameters in the translation string
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match: string, param: string) => {
        return params[param]?.toString() || match;
      });
    }

    return value;
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang); if (typeof document!=="undefined") { document.documentElement.setAttribute("lang", lang); document.cookie = `lang=${lang}; path=/; max-age=${60*60*24*365}`; }
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('nirvanaya-language', lang);
    }
  };

  // Initialize language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('nirvanaya-language') as Language;
      if (savedLanguage && ['en', 'si'].includes(savedLanguage)) {
        setLanguageState(savedLanguage);
      }
    }
  }, []);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: getTranslation,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
