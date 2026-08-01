import { useEffect, useState } from 'react';
import { adminApi, type Order } from '../../lib/api';
import { formatPrice } from '../../lib/utils';
import { statusBadgeClass } from '../../lib/orderStatus';
import DataTable, { type Column } from '../../components/admin/DataTable';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast } from '../../components/admin/Toast';
import { useDebounce } from '../../hooks/useDebounce';
import { X, Download, ChevronRight, Package, MapPin, CreditCard, FileText } from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function Orders() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = () => {
    adminApi.getOrders({
      status: statusFilter || undefined,
      q: debouncedSearch || undefined,
      from: from || undefined,
      to: to || undefined,
    })
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOrders(); }, [statusFilter, debouncedSearch, from, to]);

  const updateStatus = async (order: Order, newStatus: string) => {
    if (order.status === newStatus) return;
    try {
      await adminApi.updateOrder(order.id, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      loadOrders();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as any });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const exportCsv = async () => {
    try {
      const res = await adminApi.exportOrdersCsv();
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const columns: Column<Order>[] = [
    {
      key: 'id',
      label: 'Order',
      render: o => (
        <button
          onClick={() => setSelectedOrder(o)}
          className="font-mono text-sm hover:underline text-left"
        >
          #{o.id.slice(0, 8)}
        </button>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: o => (
        <div>
          <p className="font-medium">{o.user?.name || o.shippingAddress.name}</p>
          <p className="text-xs text-ink-500 truncate max-w-[200px]">{o.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: o => <span className="text-sm text-ink-500">{new Date(o.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: o => (
        <select
          value={o.status}
          onChange={e => updateStatus(o, e.target.value)}
          className={`px-2 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${statusBadgeClass(o.status)}`}
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'total',
      label: 'Total',
      className: 'text-right',
      render: o => <span className="font-semibold">{formatPrice(o.total)}</span>,
    },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: o => (
        <button
          onClick={() => setSelectedOrder(o)}
          className="p-2 hover:bg-ink-100 rounded-lg"
          aria-label="View details"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const renderMobileCard = (o: Order) => (
    <button
      onClick={() => setSelectedOrder(o)}
      className="w-full text-left bg-white border border-ink-200 rounded-2xl p-4 active:bg-ink-50 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs text-ink-500">#{o.id.slice(0, 8)}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${statusBadgeClass(o.status)}`}>
          {o.status}
        </span>
      </div>
      <p className="font-semibold truncate">{o.user?.name || o.shippingAddress.name}</p>
      <p className="text-xs text-ink-500 truncate">{o.customerEmail}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-ink-500">
          {new Date(o.createdAt).toLocaleDateString()} · {o.items.length} item{o.items.length === 1 ? '' : 's'}
        </span>
        <span className="font-bold">{formatPrice(o.total)}</span>
      </div>
    </button>
  );

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description={`${orders.length} order${orders.length === 1 ? '' : 's'}`}
        actions={
          <button onClick={exportCsv} className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        }
      >
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ID or email…"
            className="input-base py-2 w-full sm:w-64"
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-base py-2 w-full sm:w-auto"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="input-base py-2 w-full sm:w-auto"
            title="From date"
          />
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="input-base py-2 w-full sm:w-auto"
            title="To date"
          />
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo(''); }} className="btn-ghost text-xs w-full sm:w-auto">
              Clear dates
            </button>
          )}
        </div>
      </AdminPageHeader>

      <DataTable
        rows={orders}
        columns={columns}
        rowKey={o => o.id}
        loading={loading}
        emptyMessage="No orders found"
        renderMobileCard={renderMobileCard}
      />

      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={(patch) => {
            setSelectedOrder({ ...selectedOrder, ...patch });
            loadOrders();
          }}
        />
      )}
    </div>
  );
}

function OrderDetailDrawer({
  order,
  onClose,
  onUpdate,
}: {
  order: Order;
  onClose: () => void;
  onUpdate: (patch: Partial<Order>) => void;
}) {
  const toast = useToast();
  const [tracking, setTracking] = useState(order.trackingNumber || '');
  const [notes, setNotes] = useState(order.notes || '');

  const saveTracking = async () => {
    try {
      await adminApi.updateOrder(order.id, { trackingNumber: tracking });
      toast.success('Tracking saved');
      onUpdate({ trackingNumber: tracking });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const saveNotes = async () => {
    try {
      await adminApi.updateOrder(order.id, { notes });
      toast.success('Notes saved');
      onUpdate({ notes });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed');
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (newStatus === order.status) return;
    try {
      await adminApi.updateOrder(order.id, { status: newStatus });
      toast.success('Status updated');
      onUpdate({ status: newStatus as any });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/50 flex justify-end" onClick={onClose}>
      <div
        className="w-full sm:max-w-xl bg-white h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-200 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-500 uppercase tracking-wider">Order</p>
            <p className="font-mono text-lg font-bold">#{order.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-ink-100 rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${statusBadgeClass(order.status)}`}>
              {order.status}
            </span>
            <select
              value={order.status}
              onChange={e => updateStatus(e.target.value)}
              className="input-base py-1.5 text-sm w-auto"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <Section icon={<MapPin className="w-4 h-4" />} title="Shipping address">
            <p className="font-medium">{order.shippingAddress.name}</p>
            <p className="text-sm text-ink-500">
              {order.shippingAddress.address}<br />
              {order.shippingAddress.city}, {order.shippingAddress.zipCode}<br />
              {order.shippingAddress.country}
            </p>
            <p className="text-sm text-ink-500 mt-2">{order.customerEmail}</p>
          </Section>

          <Section icon={<Package className="w-4 h-4" />} title={`Items (${order.items.length})`}>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-lg bg-ink-100 overflow-hidden shrink-0">
                    <img
                      src={item.image}
                      alt=""
                      loading="lazy"
                      onError={e => { e.currentTarget.style.opacity = '0.3'; }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.name}</p>
                    <p className="text-xs text-ink-500">Qty {item.quantity} · {formatPrice(item.price)}</p>
                  </div>
                  <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-ink-200 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              <Row label="Shipping" value={formatPrice(order.shipping)} />
              <Row label="Tax" value={formatPrice(order.tax)} />
              <Row label="Total" value={formatPrice(order.total)} bold />
            </div>
          </Section>

          <Section icon={<CreditCard className="w-4 h-4" />} title="Tracking">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={tracking}
                onChange={e => setTracking(e.target.value)}
                placeholder="Tracking number"
                className="input-base py-2 flex-1"
              />
              <button onClick={saveTracking} className="btn-secondary shrink-0">Save</button>
            </div>
          </Section>

          <Section icon={<FileText className="w-4 h-4" />} title="Internal notes">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="input-base"
              placeholder="Notes for internal use…"
            />
            <button onClick={saveNotes} className="btn-secondary mt-2 text-sm w-full sm:w-auto">Save notes</button>
          </Section>

          {order.statusHistory && order.statusHistory.length > 0 && (
            <Section title="Status history">
              <div className="space-y-2 text-sm">
                {order.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusBadgeClass(h.status)}`}>
                      {h.status}
                    </span>
                    <span className="text-ink-500">{new Date(h.at).toLocaleString()}</span>
                    {h.by && <span className="text-ink-400 text-xs">by {h.by}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-ink-700">
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-base pt-2 border-t border-ink-200' : ''}`}>
      <span className={bold ? '' : 'text-ink-500'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}