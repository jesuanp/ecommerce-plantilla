import { createContext, useContext } from 'react';

export type Locale = 'es' | 'en';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}

export function useLocale(): Locale {
  return useI18n().locale;
}

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'es' || value === 'en';
}

export function detectLocale(): Locale {
  if (typeof navigator !== 'undefined' && navigator.language) {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('en')) return 'en';
  }
  return 'es';
}