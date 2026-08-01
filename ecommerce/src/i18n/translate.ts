import type { Locale } from './I18nContext';

export interface Translations<T> {
  es?: Partial<T>;
  en?: Partial<T>;
}

export function pickTranslation<T>(
  translations: Translations<T> | null | undefined,
  locale: Locale,
  fallback: Locale = 'en'
): Partial<T> | null {
  if (!translations) return null;
  const primary = translations[locale];
  if (primary && Object.keys(primary).length > 0) return primary;
  const fb = translations[fallback];
  if (fb && Object.keys(fb).length > 0) return fb;
  const other = Object.values(translations).find(v => v && Object.keys(v).length > 0);
  return other ?? null;
}

export function localizedField<T>(
  translations: Translations<T> | null | undefined,
  field: keyof T,
  locale: Locale,
  fallback: Locale = 'en'
): T[keyof T] | undefined {
  const t = pickTranslation(translations, locale, fallback);
  if (!t) return undefined;
  return t[field];
}