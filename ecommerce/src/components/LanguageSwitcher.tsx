import { useI18n, type Locale } from '../i18n/I18nContext';
import { cn } from '../lib/utils';

interface Props {
  size?: 'sm' | 'md';
  variant?: 'pill' | 'plain';
  className?: string;
}

const LOCALES: Locale[] = ['es', 'en'];

const LABELS: Record<Locale, string> = { es: 'ES', en: 'EN' };

export default function LanguageSwitcher({ size = 'md', variant = 'pill', className }: Props) {
  const { locale, setLocale } = useI18n();

  if (variant === 'plain') {
    return (
      <div className={cn('flex items-center gap-1', className)} role="group" aria-label="Language">
        {LOCALES.map(loc => (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc)}
            aria-pressed={locale === loc}
            className={cn(
              'rounded-md font-semibold uppercase transition-colors',
              size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
              locale === loc
                ? 'bg-ink-900 text-white'
                : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100'
            )}
          >
            {LABELS[loc]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center bg-ink-100 rounded-full p-0.5 text-xs font-semibold',
        className
      )}
      role="group"
      aria-label="Language"
    >
      {LOCALES.map(loc => (
        <button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          aria-pressed={locale === loc}
          className={cn(
            'rounded-full transition-all',
            size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
            locale === loc
              ? 'bg-white text-ink-900 shadow-sm'
              : 'text-ink-500 hover:text-ink-900'
          )}
        >
          {LABELS[loc]}
        </button>
      ))}
    </div>
  );
}