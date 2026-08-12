import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { I18nContext, type I18nContextValue, type Locale, detectLocale, isLocale } from './I18nContext';
import es from './locales/es.json';
import en from './locales/en.json';

const STORAGE_KEY = 'raybert-locale';

const dictionaries: Record<Locale, Record<string, string>> = {
  es: es as Record<string, string>,
  en: en as Record<string, string>,
};

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined ? `{${key}}` : String(v);
  });
}

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locale, setLocaleState] = useState<Locale>(() => {
    const fromUrl = searchParams.get('lang');
    if (isLocale(fromUrl)) return fromUrl;
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isLocale(stored)) return stored;
    }
    return detectLocale();
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
    const current = searchParams.get('lang');
    if (isLocale(current) && current === locale) return;
    const next = new URLSearchParams(searchParams);
    next.set('lang', locale);
    setSearchParams(next, { replace: true });
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = dictionaries[locale] || dictionaries.es;
      const value = dict[key];
      if (value === undefined) {
        const fallback = dictionaries.en[key] ?? dictionaries.es[key];
        return fallback !== undefined ? interpolate(fallback, vars) : key;
      }
      return interpolate(value, vars);
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}