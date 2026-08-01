import { Link } from 'react-router-dom';
import { Star, Plus } from 'lucide-react';
import type { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { useCartStore } from '../store/cartStore';
import { useI18n } from '../i18n/I18nContext';
import { pickTranslation } from '../i18n/translate';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const addItem = useCartStore(s => s.addItem);
  const { t, locale } = useI18n();
  const tr = pickTranslation(product.translations, locale);

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const displayName = tr?.name ?? product.name;
  const displayBrand = tr?.brand ?? product.brand;
  const altName = displayName;

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-ink-200 card-hover">
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-square overflow-hidden bg-ink-100">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={altName}
              loading="lazy"
              onError={(e) => { e.currentTarget.style.opacity = '0.3'; }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-ink-400 text-xs">
              {t('product.empty')}
            </div>
          )}
        </div>
      </Link>

      {onSale && (
        <div className="absolute top-3 left-3 bg-ink-900 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
          {t('product.sale')}
        </div>
      )}

      <button
        onClick={() => addItem(product, 1)}
        disabled={product.stock === 0}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur grid place-items-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ink-900 hover:text-white disabled:opacity-30"
        aria-label={t('product.addToCart')}
      >
        <Plus className="w-4 h-4" />
      </button>

      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs uppercase tracking-wider text-ink-400 font-semibold">
            {displayBrand}
          </p>
          <div className="flex items-center gap-1 text-xs text-ink-500">
            <Star className="w-3 h-3 fill-current text-yellow-500" />
            <span>{product.rating}</span>
          </div>
        </div>

        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-ink-900 leading-snug line-clamp-2 hover:underline">
            {displayName}
          </h3>
        </Link>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-ink-900">{formatPrice(product.price)}</span>
          {onSale && (
            <span className="text-sm text-ink-400 line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
