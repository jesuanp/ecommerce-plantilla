import { useEffect, useState } from 'react';
import { adminApi, pickNumber, pickArray, type Order } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import StatsCard from '../../components/admin/StatsCard';
import Chart from '../../components/admin/Chart';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useI18n } from '../../i18n/I18nContext';
import { DollarSign, ShoppingCart, TrendingUp, BarChart3 } from 'lucide-react';

export default function Analytics() {
  const { t } = useI18n();
  const [overview, setOverview] = useState<ReturnType<typeof emptyOverview> | null>(null);
  const [sales, setSales] = useState<Array<{ date: string; revenue: number; count: number }>>([]);
  const [byCategory, setByCategory] = useState<Array<{ name: string; revenue: number }>>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    Promise.all([
      adminApi.getAnalyticsOverview(),
      adminApi.getAnalyticsSales(days),
      adminApi.getAnalyticsByCategory(),
      adminApi.getOrders({ from: from.toISOString(), to: to.toISOString(), limit: 1000 }),
    ])
      .then(([o, s, c, ord]) => {
        setOverview({ ...emptyOverview(), ...o.data });
        setByCategory(pickArray<{ name: string; revenue: number }>(c.data)
          .map(d => ({ ...d, revenue: pickNumber(d.revenue) })));

        const fromBackend = pickArray<{ date: string; revenue: number; count: number }>(s.data)
          .map(d => ({ ...d, revenue: pickNumber(d.revenue), count: pickNumber(d.count) }));

        const orders = pickArray<Order>(ord.data);
        const derived = buildSalesFromOrders(orders, days);

        setSales(fromBackend.length > 0 ? fromBackend : derived);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  if (loading || !overview) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-white rounded w-1/3 animate-pulse" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title={t('admin.analytics.title')} description={t('admin.analytics.description')} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label={t('admin.analytics.totalRevenue')}
          value={formatPrice(pickNumber(overview.totalRevenue))}
          icon={<DollarSign className="w-5 h-5" />}
          accent="green"
        />
        <StatsCard
          label={t('admin.analytics.orders')}
          value={pickNumber(overview.totalOrders)}
          icon={<ShoppingCart className="w-5 h-5" />}
          accent="blue"
        />
        <StatsCard
          label={t('admin.analytics.aov')}
          value={formatPrice(pickNumber(overview.aov, overview.averageOrderValue))}
          icon={<BarChart3 className="w-5 h-5" />}
          accent="brand"
        />
        <StatsCard
          label={t('admin.analytics.thisMonth')}
          value={formatPrice(pickNumber(overview.monthRevenue, overview.currentMonthRevenue))}
          delta={pickNumber(overview.monthGrowth, overview.monthOverMonthGrowth)}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="orange"
        />
      </div>

      <div className="bg-white border border-ink-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold">{t('admin.analytics.sales')}</h2>
          <select
            value={days}
            onChange={e => setDays(parseInt(e.target.value))}
            className="input-base py-1.5 w-auto text-sm"
          >
            <option value={7}>{t('admin.analytics.last7')}</option>
            <option value={30}>{t('admin.analytics.last30')}</option>
            <option value={90}>{t('admin.analytics.last90')}</option>
          </select>
        </div>
        <Chart
          height={280}
          type="bar"
          series={[{
            name: 'Revenue',
            color: '#7c3aed',
            data: sales.map(s => ({
              label: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              fullLabel: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              value: s.revenue,
            })),
          }]}
          formatY={v => `$${Math.round(v).toLocaleString()}`}
        />
      </div>

      <div className="bg-white border border-ink-200 rounded-2xl p-6">
        <h2 className="font-bold mb-4">{t('admin.analytics.revenueByCategory')}</h2>
        {byCategory.length === 0 ? (
          <p className="text-sm text-ink-500">{t('admin.analytics.noData')}</p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const max = Math.max(...byCategory.map(c => c.revenue), 0);
              return byCategory.map(c => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-ink-500">{formatPrice(c.revenue)}</span>
                  </div>
                  <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${max > 0 ? (c.revenue / max) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function emptyOverview() {
  return {
    totalOrders: 0,
    totalRevenue: 0,
    aov: 0,
    averageOrderValue: 0,
    monthRevenue: 0,
    currentMonthRevenue: 0,
    prevMonthRevenue: 0,
    previousMonthRevenue: 0,
    monthGrowth: 0,
    monthOverMonthGrowth: 0,
  };
}

function buildSalesFromOrders(
  orders: Order[],
  days: number,
): Array<{ date: string; revenue: number; count: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets: Array<{ date: string; revenue: number; count: number }> = [];
  const indexByDate = new Map<string, number>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = toDateKey(d);
    indexByDate.set(key, buckets.length);
    buckets.push({ date: key, revenue: 0, count: 0 });
  }

  for (const order of orders) {
    if (!order.createdAt) continue;
    const od = new Date(order.createdAt);
    if (Number.isNaN(od.getTime())) continue;
    od.setHours(0, 0, 0, 0);
    const key = toDateKey(od);
    const idx = indexByDate.get(key);
    if (idx === undefined) continue;
    buckets[idx].revenue += pickNumber(order.total);
    buckets[idx].count += 1;
  }

  return buckets;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}