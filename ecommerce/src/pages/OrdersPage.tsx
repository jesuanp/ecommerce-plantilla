import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ordersApi, type Order } from '../lib/api';
import { formatPrice } from '../lib/utils';

export default function OrdersPage() {
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const highlightId = (location.state as { highlightOrderId?: string } | null)?.highlightOrderId;
  const highlightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ordersApi.getAll()
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!highlightId || loading) return;
    const node = highlightRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightId, loading, orders]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ink-100 rounded w-1/4 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-ink-100 rounded-2xl">
          <p className="text-2xl mb-2">📦</p>
          <h3 className="font-semibold">No orders yet</h3>
          <p className="text-ink-500 mt-1">Start shopping to see your orders here.</p>
          <Link to="/shop" className="btn-primary mt-4 inline-block">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const isHighlight = order.id === highlightId;
            return (
              <div
                key={order.id}
                ref={isHighlight ? highlightRef : undefined}
                className={`bg-white border rounded-2xl p-6 transition-colors ${
                  isHighlight ? 'border-ink-900 ring-2 ring-ink-900/10' : 'border-ink-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-ink-500 uppercase tracking-wider">Order ID</p>
                    <p className="font-mono text-sm">{order.id.slice(0, 8)}...</p>
                    <p className="text-xs text-ink-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'paid' ? 'bg-green-100 text-green-700' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 rounded bg-ink-100 overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="line-clamp-1">{item.name}</p>
                        <p className="text-ink-500 text-xs">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-ink-500">+{order.items.length - 3} more items</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-ink-100">
                  <div className="text-sm">
                    <span className="text-ink-500">Total: </span>
                    <span className="font-semibold">{formatPrice(order.total)}</span>
                  </div>
                  <div className="text-sm text-ink-500">
                    {order.shippingAddress.name}, {order.shippingAddress.city}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}