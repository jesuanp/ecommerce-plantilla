import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-200 bg-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-ink-900 text-white grid place-items-center font-bold">
                L
              </div>
              <span className="text-lg font-bold tracking-tight">Lumen</span>
            </div>
            <p className="mt-3 text-sm text-ink-500 max-w-sm">
              Curated goods, delivered with care. We partner with makers and brands who care about the details.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Shop</h4>
            <ul className="space-y-2 text-sm text-ink-500">
              <li><Link to="/shop" className="hover:text-ink-900">All products</Link></li>
              <li><Link to="/categories" className="hover:text-ink-900">Categories</Link></li>
              <li><Link to="/shop?sort=newest" className="hover:text-ink-900">New arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Support</h4>
            <ul className="space-y-2 text-sm text-ink-500">
              <li><a href="#" className="hover:text-ink-900">Shipping</a></li>
              <li><a href="#" className="hover:text-ink-900">Returns</a></li>
              <li><a href="#" className="hover:text-ink-900">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-ink-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink-400">© {new Date().getFullYear()} Lumen Goods Inc.</p>
          <div className="flex items-center gap-4 text-xs text-ink-400">
            <span>Secure payments via</span>
            <span className="font-semibold text-ink-700">Stripe</span>
            <span>·</span>
            <span className="font-semibold text-ink-700">PayPal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
