import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { formatPrice, calculateShipping, calculateTax } from '../lib/utils';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCartStore();
  const sub = subtotal();
  const shipping = calculateShipping(sub);
  const tax = calculateTax(sub);
  const total = sub + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-ink-100 grid place-items-center mx-auto mb-6">
          <ShoppingBag className="w-9 h-9 text-ink-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Your cart is empty</h1>
        <p className="mt-2 text-ink-500">Discover our collection and add something you'll love.</p>
        <Link to="/shop" className="btn-primary mt-8">
          Browse products <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Your cart</h1>
          <p className="mt-1 text-ink-500">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        <button
          onClick={clearCart}
          className="text-sm text-ink-500 hover:text-red-600 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Items */}
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.productId}
              className="flex gap-4 p-4 bg-white border border-ink-200 rounded-2xl"
            >
              <Link
                to={`/product/${item.productId}`}
                className="shrink-0 w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-ink-100"
              >
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </Link>

              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/product/${item.productId}`}
                      className="font-semibold leading-snug hover:underline line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-ink-500 mt-1">{formatPrice(item.price)} each</p>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1.5 text-ink-400 hover:text-red-600 transition-colors shrink-0"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-end justify-between mt-auto pt-3">
                  <div className="flex items-center border border-ink-200 rounded-full">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-2 hover:text-ink-900 text-ink-500"
                      aria-label="Decrease"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className="p-2 hover:text-ink-900 text-ink-500 disabled:opacity-30"
                      aria-label="Increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-lg font-bold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 self-start">
          <div className="bg-ink-100 rounded-2xl p-6 space-y-3">
            <h2 className="text-lg font-bold mb-2">Order summary</h2>

            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Subtotal</span>
              <span className="font-medium">{formatPrice(sub)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Shipping</span>
              <span className="font-medium">
                {shipping === 0 ? 'Free' : formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-500">Tax (estimated)</span>
              <span className="font-medium">{formatPrice(tax)}</span>
            </div>

            <div className="pt-3 border-t border-ink-200 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <Link to="/checkout" className="btn-primary w-full mt-4">
              Proceed to checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/shop" className="btn-ghost w-full text-sm">
              Continue shopping
            </Link>

            <div className="pt-4 mt-2 border-t border-ink-200 space-y-1.5 text-xs text-ink-500">
              <p>✓ Secure payments via Stripe & PayPal</p>
              <p>✓ 30-day no-questions returns</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
