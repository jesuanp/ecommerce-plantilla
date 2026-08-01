import { useAuthStore } from '../../store/authStore';
import { useI18n } from '../../i18n/I18nContext';
import LanguageSwitcher from '../LanguageSwitcher';

export default function AdminTopbar() {
  const { user } = useAuthStore();
  const { t } = useI18n();

  return (
    <header className="h-16 bg-white border-b border-ink-200 sticky top-0 z-20 flex items-center px-4 sm:px-6 lg:px-8">
      <div className="lg:hidden font-bold tracking-tight">{t('admin.topbar.title')}</div>
      <div className="hidden lg:block text-sm text-ink-500">{t('admin.topbar.subtitle')}</div>
      <div className="flex-1" />
      <LanguageSwitcher size="sm" className="mr-2" />
      {user && (
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium leading-tight">{user.name}</p>
            <p className="text-xs text-ink-500 leading-tight">{user.email}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center font-bold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </header>
  );
}