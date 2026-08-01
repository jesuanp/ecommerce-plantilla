import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Truck, Shield, RotateCcw, Star, ChevronRight } from 'lucide-react';
import { productsApi, type Product } from '../lib/api';
import { formatPrice } from '../lib/utils';
import { useCartStore } from '../store/cartStore';
import ProductCard from '../components/ProductCard';
import { useI18n } from '../i18n/I18nContext';
import { pickTranslation } from '../i18n/translate';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore(s => s.addItem);

  useEffect(() => {
    if (!id) return;
    setLoadError(null);
    productsApi.getById(id)
      .then(res => {
        setProduct(res.data.product);
        setRelated(res.data.related);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setProduct(null);
        } else {
          setProduct(null);
          setLoadError(err.response?.data?.detail || err.message || 'Failed to load product');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ink-100 rounded w-1/2 mx-auto" />
          <div className="h-4 bg-ink-100 rounded w-1/3 mx-auto" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold">
          {loadError ? 'Unable to load product' : 'Product not found'}
        </h2>
        {loadError && <p className="mt-2 text-ink-500 text-sm">{loadError}</p>}
        <Link to="/shop" className="btn-primary mt-4">Back to shop</Link>
      </div>
    );
  }

  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const categorySlug = product.categorySlug || product.category?.slug || '';
  const tr = pickTranslation(product.translations, locale);
  const displayName = tr?.name ?? product.name;
  const displayBrand = tr?.brand ?? product.brand;
  const displayLongDescription = tr?.longDescription ?? product.longDescription;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      description: product.description,
      longDescription: product.longDescription,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      images: product.images,
      category: product.category,
      tags: product.tags,
      stock: product.stock,
      rating: product.rating,
      reviewCount: product.reviewCount,
      featured: product.featured,
    }, quantity);
  };

  const handleBuyNow = () => {
    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      description: product.description,
      longDescription: product.longDescription,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      images: product.images,
      category: product.category,
      tags: product.tags,
      stock: product.stock,
      rating: product.rating,
      reviewCount: product.reviewCount,
      featured: product.featured,
    }, quantity, { openDrawer: false });
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-ink-500 mb-6">
        <Link to="/" className="hover:text-ink-900">{t('product.breadcrumb.home')}</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/shop" className="hover:text-ink-900">{t('product.breadcrumb.shop')}</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/shop?category=${categorySlug}`} className="hover:text-ink-900 capitalize">
          {product.category?.name || categorySlug}
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-ink-900">{displayName}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div>
          <div className="aspect-square rounded-3xl overflow-hidden bg-ink-100 mb-4">
            <img
              src={product.images[activeImage]}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                    activeImage === i ? 'border-ink-900' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-widest font-semibold text-ink-500">
              {displayBrand}
            </span>
            {onSale && (
              <span className="text-[11px] font-bold uppercase tracking-wide bg-ink-900 text-white px-2 py-0.5 rounded-full">
                {t('product.sale')}
              </span>
            )}
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{displayName}</h1>

          <div className="flex items-center gap-3 mt-3 text-sm text-ink-500">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-ink-200'
                  }`}
                />
              ))}
            </div>
            <span>{product.rating} ({t('product.specs.reviews', { count: product.reviewCount })})</span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-4xl font-bold">{formatPrice(product.price)}</span>
            {onSale && (
              <span className="text-xl text-ink-400 line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>

          <p className="mt-6 text-ink-700 leading-relaxed">{displayLongDescription}</p>

          <div className="mt-6">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-ink-700">
                  {t('product.inStock', { count: product.stock })}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                {t('product.outOfStock')}
              </span>
            )}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <span className="text-sm font-medium">{t('product.quantity')}</span>
            <div className="flex items-center border border-ink-200 rounded-full">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 hover:text-ink-900 text-ink-500"
                aria-label="Decrease"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 font-medium w-10 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="p-2.5 hover:text-ink-900 text-ink-500 disabled:opacity-30"
                aria-label="Increase"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="btn-secondary"
            >
              {t('product.addToCart')}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="btn-primary"
            >
              {t('product.buyNow')}
            </button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 pt-8 border-t border-ink-200">
            <div className="text-center">
              <Truck className="w-5 h-5 mx-auto mb-1.5 text-ink-700" />
              <p className="text-xs font-medium">{t('product.specs.shipping')}</p>
              <p className="text-xs text-ink-500">{t('product.specs.shippingHint')}</p>
            </div>
            <div className="text-center">
              <RotateCcw className="w-5 h-5 mx-auto mb-1.5 text-ink-700" />
              <p className="text-xs font-medium">{t('product.specs.returns')}</p>
              <p className="text-xs text-ink-500">{t('product.specs.returnsHint')}</p>
            </div>
            <div className="text-center">
              <Shield className="w-5 h-5 mx-auto mb-1.5 text-ink-700" />
              <p className="text-xs font-medium">{t('product.specs.securePay')}</p>
              <p className="text-xs text-ink-500">Stripe & PayPal</p>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="text-2xl font-bold tracking-tight mb-6">You might also like</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {related.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
