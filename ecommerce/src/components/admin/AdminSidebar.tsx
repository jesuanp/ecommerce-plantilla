import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  BarChart3,
  TicketPercent,
  Star,
  Settings,
  History,
  LogOut,
  Store,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useI18n } from '../../i18n/I18nContext';
import LanguageSwitcher from '../LanguageSwitcher';

interface NavItem {
  to: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const PRIMARY: NavItem[] = [
  { to: '/admin', labelKey: 'admin.dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', labelKey: 'admin.products', icon: Package },
  { to: '/admin/categories', labelKey: 'admin.categories', icon: Tags },
  { to: '/admin/orders', labelKey: 'admin.orders', icon: ShoppingCart },
  { to: '/admin/users', labelKey: 'admin.customers', icon: Users },
];

const SECONDARY: NavItem[] = [
  { to: '/admin/analytics', labelKey: 'admin.analytics', icon: BarChart3 },
  { to: '/admin/promotions', labelKey: 'admin.promotions', icon: TicketPercent },
  { to: '/admin/reviews', labelKey: 'admin.reviews', icon: Star },
  { to: '/admin/settings', labelKey: 'admin.settings', icon: Settings },
  { to: '/admin/audit', labelKey: 'admin.audit', icon: History },
];

export default function AdminSidebar() {
  const { logout, user } = useAuthStore();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:sticky lg:top-0 lg:h-screen bg-ink-900 text-white shrink-0">
      <div className="h-16 px-6 flex items-center gap-2 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-white text-ink-900 grid place-items-center font-bold">
          R
        </div>
        <span className="font-bold tracking-tight">Raybert Shop Admin</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 min-h-0">
        <Section title={t('admin.section.manage')}>
          {PRIMARY.map(item => (
            <NavItem key={item.to} item={item} label={t(item.labelKey)} />
          ))}
        </Section>

        <Section title={t('admin.section.insights')}>
          {SECONDARY.map(item => (
            <NavItem key={item.to} item={item} label={t(item.labelKey)} />
          ))}
        </Section>
      </nav>

      <div className="px-3 py-3 border-t border-white/10 space-y-1 shrink-0">
        <div className="flex justify-center mb-2">
          <LanguageSwitcher size="sm" variant="plain" />
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Store className="w-4 h-4" />
          {t('admin.viewStorefront')}
        </a>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('admin.signOut')}
        </button>
        {user && (
          <div className="px-3 py-2 text-xs text-white/50 truncate">
            {user.email}
          </div>
        )}
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 mb-1 text-[10px] uppercase tracking-widest font-semibold text-white/40">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({ item, label }: { item: NavItem; label: string }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-white text-ink-900'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        )
      }
    >
      <Icon className="w-4 h-4" />
      {label}
    </NavLink>
  );
}