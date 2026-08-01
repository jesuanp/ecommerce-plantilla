import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../i18n/I18nContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, isLoading } = useAuthStore();
  const { t } = useI18n();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.email, form.password, form.name);
      }
      const stored = useAuthStore.getState().user;
      navigate(stored?.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.message || t('auth.error.generic'));
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">
          {mode === 'login' ? t('auth.login.title') : t('auth.register.title')}
        </h1>
        <p className="mt-2 text-ink-500">
          {mode === 'login' ? t('auth.login.subtitle') : t('auth.register.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-ink-200 rounded-2xl p-6 space-y-4">
        {mode === 'register' && (
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('auth.field.name')}</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="input-base"
              placeholder={t('auth.field.namePlaceholder')}
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium block mb-1.5">{t('auth.field.email')}</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            className="input-base"
            placeholder={t('auth.field.emailPlaceholder')}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">{t('auth.field.password')}</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            className="input-base"
            placeholder={t('auth.field.passwordPlaceholder')}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? t('auth.loading') : (mode === 'login' ? t('auth.login.cta') : t('auth.register.cta'))}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-ink-500">
          {mode === 'login' ? t('auth.toggle.toRegister') : t('auth.toggle.toLogin')}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="ml-1 font-medium text-ink-900 hover:underline"
          >
            {mode === 'login' ? t('auth.toggle.registerCta') : t('auth.toggle.loginCta')}
          </button>
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="text-sm text-ink-500 hover:text-ink-900">
          {t('auth.guest')}
        </Link>
      </div>
    </div>
  );
}
