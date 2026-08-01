import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MoreHorizontal,
  X,
  BarChart3,
  TicketPercent,
  Star,
  Settings,
  History,
  LogOut,
  Store,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useI18n } from '../../i18n/I18nContext';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const PRIMARY: NavItem[] = [
  { to: '/admin', label: 'admin.dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'admin.products', icon: Package },
  { to: '/admin/orders', label: 'admin.orders', icon: ShoppingCart },
  { to: '/admin/users', label: 'admin.customers', icon: Users },
];

const SECONDARY: NavItem[] = [
  { to: '/admin/analytics', label: 'admin.analytics', icon: BarChart3 },
  { to: '/admin/promotions', label: 'admin.promotions', icon: TicketPercent },
  { to: '/admin/reviews', label: 'admin.reviews', icon: Star },
  { to: '/admin/settings', label: 'admin.settings', icon: Settings },
  { to: '/admin/audit', label: 'admin.audit', icon: History },
];

export default function BottomNav() {
  const { t } = useI18n();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [moreOpen]);

  const closeMore = () => setMoreOpen(false);

  const isSecondaryActive = SECONDARY.some(item => {
    if (item.end) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  });

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-ink-200 lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Admin navigation"
      >
        <div className="grid grid-cols-5 h-16">
          {PRIMARY.map(item => (
            <PrimaryItem key={item.to} item={item} />
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
              isSecondaryActive ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
            )}
            aria-label="Open more menu"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span>{t('admin.more')}</span>
          </button>
        </div>
      </nav>

      {moreOpen && <MoreSheet onClose={closeMore} />}
    </>
  );
}

function PrimaryItem({ item }: { item: NavItem }) {
  const { t } = useI18n();
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
          isActive ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('w-5 h-5', isActive && 'stroke-[2.5]')} />
          <span>{t(item.label)}</span>
        </>
      )}
    </NavLink>
  );
}

function MoreSheet({ onClose }: { onClose: () => void }) {
  const { logout, user } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  const goTo = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-ink-900/60 z-40 lg:hidden animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl lg:hidden animate-in slide-in-from-bottom duration-200"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        role="dialog"
        aria-label="More menu"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="font-semibold">{t('admin.more')}</p>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-ink-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {user && (
          <div className="px-5 pb-3 text-xs text-ink-500 truncate">{user.email}</div>
        )}

        <div className="px-3 pb-3 max-h-[60vh] overflow-y-auto">
          {SECONDARY.map(item => (
            <SecondaryItem key={item.to} item={item} onClick={() => goTo(item.to)} />
          ))}
        </div>

        <div className="border-t border-ink-200 p-3 space-y-1">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-ink-100"
          >
            <Store className="w-5 h-5" />
            {t('admin.viewStorefront')}
          </a>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            {t('admin.signOut')}
          </button>
        </div>
      </div>
    </>
  );
}

function SecondaryItem({ item, onClick }: { item: NavItem; onClick: () => void }) {
  const { t } = useI18n();
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
          isActive ? 'bg-ink-900 text-white' : 'hover:bg-ink-100'
        )
      }
    >
      <Icon className="w-5 h-5" />
      {t(item.label)}
    </NavLink>
  );
}