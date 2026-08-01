import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type DashboardStats } from '../../lib/api';
import StatsCard from '../../components/admin/StatsCard';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import Chart from '../../components/admin/Chart';
import { statusBadgeClass } from '../../lib/orderStatus';
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  Plus,
  ArrowRight,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<Array<{ productId: string; name: string; sold: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getTopProducts()])
      .then(([s, tp]) => {
        setStats(s.data);
        setTopProducts(tp.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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

  if (!stats) return null;

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of your store performance"
        actions={
          <>
            <Link to="/admin/products/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Product
            </Link>
          </>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Revenue"
          value={`$${stats.totalRevenue.toFixed(2)}`}
          icon={<DollarSign className="w-5 h-5" />}
          accent="green"
        />
        <StatsCard
          label="Orders"
          value={stats.totalOrders}
          icon={<ShoppingCart className="w-5 h-5" />}
          accent="blue"
        />
        <StatsCard
          label="Customers"
          value={stats.totalUsers}
          icon={<Users className="w-5 h-5" />}
          accent="purple"
        />
        <StatsCard
          label="Products"
          value={stats.totalProducts}
          hint={stats.lowStock > 0 ? `${stats.lowStock} low stock` : undefined}
          icon={<Package className="w-5 h-5" />}
          accent="brand"
        />
      </div>

      {stats.lowStock > 0 && (
        <Link
          to="/admin/products?lowStock=1"
          className="mb-6 flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl text-orange-900 hover:bg-orange-100 transition-colors"
        >
          <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
          <div className="flex-1 text-sm">
            <strong>{stats.lowStock} product{stats.lowStock === 1 ? '' : 's'}</strong> with low stock (less than 5 units).
          </div>
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-ink-200 rounded-2xl p-6">
          <h2 className="font-bold mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {stats.ordersByStatus.length === 0 ? (
              <p className="text-ink-500 text-sm">No orders yet</p>
            ) : (
              stats.ordersByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              ))
            )}
          </div>
          <Link to="/admin/orders" className="btn-secondary mt-6 w-full text-center block">
            View all orders
          </Link>
        </div>

        <div className="bg-white border border-ink-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Recent Orders</h2>
            <Link to="/admin/orders" className="text-sm font-medium text-ink-500 hover:text-ink-900">
              View all
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-ink-500 text-sm text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {order.user?.name || order.customerEmail}
                    </p>
                    <p className="text-ink-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="font-semibold">${parseFloat(order.total).toFixed(2)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadgeClass(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className="mt-6 bg-white border border-ink-200 rounded-2xl p-6">
          <h2 className="font-bold mb-4">Top selling products</h2>
          <Chart
            height={220}
            series={[{
              name: 'Units sold',
              data: topProducts.map(p => ({ label: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name, value: parseInt(String(p.sold)) })),
            }]}
          />
          <div className="mt-4 space-y-2">
            {topProducts.map((p, i) => (
              <div key={p.productId || i} className="flex items-center justify-between text-sm">
                <span className="truncate">{p.name}</span>
                <span className="font-semibold text-ink-500">{p.sold} sold</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}