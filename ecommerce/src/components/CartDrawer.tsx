import { Link } from 'react-router-dom';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { formatPrice, calculateShipping, calculateTax } from '../lib/utils';
import { useEffect } from 'react';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } = useCartStore();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sub = subtotal();
  const shipping = calculateShipping(sub);
  const tax = calculateTax(sub);
  const total = sub + shipping + tax;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-900/50 z-50 animate-in fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white z-50 shadow-2xl flex flex-col"
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink-200">
          <h2 className="text-lg font-bold">Your cart</h2>
          <button
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-ink-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-ink-100 grid place-items-center mb-4">
              <span className="text-3xl">🛍️</span>
            </div>
            <h3 className="font-semibold mb-1">Your cart is empty</h3>
            <p className="text-sm text-ink-500 mb-6">
              Discover our collection and add something you'll love.
            </p>
            <Link to="/shop" onClick={closeCart} className="btn-primary">
              Browse products
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map(item => (
                <div key={item.productId} className="flex gap-4 py-3">
                  <Link
                    to={`/product/${item.productId}`}
                    onClick={closeCart}
                    className="shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-ink-100"
                  >
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${item.productId}`}
                      onClick={closeCart}
                      className="block font-medium text-sm leading-snug line-clamp-2 hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-ink-500 mt-1">{formatPrice(item.price)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-ink-200 rounded-full">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1.5 hover:text-ink-900 text-ink-500"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-sm font-medium w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="p-1.5 hover:text-ink-900 text-ink-500 disabled:opacity-30"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-1.5 text-ink-400 hover:text-red-600 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-ink-200 px-6 py-5 space-y-2">
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
                <span className="text-ink-500">Tax</span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-ink-200">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              <Link
                to="/checkout"
                onClick={closeCart}
                className="btn-primary w-full mt-3"
              >
                Checkout
              </Link>
              <button
                onClick={closeCart}
                className="btn-ghost w-full text-sm"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
