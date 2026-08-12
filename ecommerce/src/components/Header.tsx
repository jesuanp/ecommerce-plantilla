import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, Search, User, LogOut, Settings } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useI18n } from '../i18n/I18nContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const itemCount = useCartStore(s => s.itemCount());
  const openCart = useCartStore(s => s.openCart);
  const { user, logout } = useAuthStore();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-ink-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-ink-900 text-white grid place-items-center font-bold group-hover:scale-105 transition-transform">
              R
            </div>
            <span className="text-lg font-bold tracking-tight">Raybert Shop</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                  isActive ? 'text-ink-900 bg-ink-100' : 'text-ink-500 hover:text-ink-900'
                )
              }
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                  isActive ? 'text-ink-900 bg-ink-100' : 'text-ink-500 hover:text-ink-900'
                )
              }
            >
              {t('nav.shop')}
            </NavLink>
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                cn(
                  'px-4 py-2 text-sm font-medium rounded-full transition-colors',
                  isActive ? 'text-ink-900 bg-ink-100' : 'text-ink-500 hover:text-ink-900'
                )
              }
            >
              {t('nav.categories')}
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher size="sm" className="hidden sm:inline-flex" />
            <form onSubmit={handleSearch} className="hidden sm:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('nav.search')}
                  className="pl-9 pr-4 py-2 w-48 lg:w-64 bg-ink-100 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:border-ink-900 focus:w-72 transition-all"
                />
              </div>
            </form>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2.5 rounded-full hover:bg-ink-100 transition-colors"
                >
                  <User className="w-5 h-5" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-ink-200 rounded-2xl shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-ink-100">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-ink-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-ink-50"
                      >
                        <User className="w-4 h-4" />
                        {t('nav.profile')}
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-ink-50"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        {t('nav.orders')}
                      </Link>
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-ink-50"
                        >
                          <Settings className="w-4 h-4" />
                          {t('nav.admin')}
                        </Link>
                      )}
                    </div>
                    <div className="py-1 border-t border-ink-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-ink-50 text-red-600 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 p-2.5 rounded-full hover:bg-ink-100 transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
            )}

            <button
              onClick={openCart}
              className="relative p-2.5 rounded-full hover:bg-ink-100 transition-colors"
              aria-label="Open cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-ink-900 text-white text-xs font-bold rounded-full grid place-items-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}