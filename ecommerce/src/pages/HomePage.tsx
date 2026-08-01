import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Zap, Shield, Truck } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productsApi, categoriesApi, type Product, type Category } from '../lib/api';
import { formatPrice } from '../lib/utils';
import { useI18n } from '../i18n/I18nContext';

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % featured.length);
  }, [featured.length]);

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + featured.length) % featured.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  useEffect(() => {
    Promise.all([
      productsApi.getFeatured(),
      productsApi.getAll({ sort: 'featured' }),
      categoriesApi.getAll(),
    ])
      .then(([featuredRes, allProductsRes, categoriesRes]) => {
        setFeatured(featuredRes.data);
        const deals = allProductsRes.data.filter(p => p.compareAtPrice && p.compareAtPrice > p.price);
        setDealProducts(deals.slice(0, 4));
        setCategories(categoriesRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ink-900" />
      </div>
    );
  }

  return (
    <div>
      <HeroSection
        products={featured}
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        nextSlide={nextSlide}
        prevSlide={prevSlide}
      />

      <CategoriesStrip categories={categories} />

      {dealProducts.length > 0 && <DealsSection products={dealProducts} />}

      <FeaturedSection products={featured} />

      {/* <ValuePropsSection /> */}
    </div>
  );
}

interface HeroSectionProps {
  products: Product[];
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
}

function HeroSection({ products, currentSlide, setCurrentSlide, nextSlide, prevSlide }: HeroSectionProps) {
  const { t } = useI18n();

  if (products.length === 0) return null;

  const product = products[currentSlide];
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  return (
    <section className="relative bg-ink-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[500px]">
          <div className="relative z-10 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
              <Zap className="w-3 h-3 text-yellow-400" />
              {discount ? t('home.hero.zapDiscount', { discount }) : t('home.hero.featured')}
            </div>
            <p className="text-ink-400 text-sm font-medium uppercase tracking-wider mb-3">
              {product.brand}
            </p>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.05] mb-4">
              {product.name}
            </h1>
            <p className="text-ink-300 text-lg mb-6 max-w-md line-clamp-2">
              {product.description}
            </p>
            <div className="flex items-center gap-4 mb-8">
              <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-xl text-ink-500 line-through">{formatPrice(product.compareAtPrice)}</span>
              )}
              <div className="flex items-center gap-1 text-sm">
                <span className="text-yellow-400">★</span>
                <span>{product.rating}</span>
                <span className="text-ink-500">({product.reviewCount})</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={`/product/${product.id}`} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-ink-900 font-bold rounded-full hover:bg-ink-100 transition-colors">
                {t('home.hero.buyNow')} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/shop" className="inline-flex items-center gap-2 px-8 py-4 border border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-colors">
                {t('home.hero.viewAll')}
              </Link>
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-radial from-white/5 to-transparent rounded-full" />
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover rounded-3xl shadow-2xl"
              />
              <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-ink-900 text-sm font-bold px-4 py-2 rounded-full">
                {t('home.hero.freeShippingBadge')}
              </div>
            </div>

            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label={t('home.hero.prev')}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white/10 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label={t('home.hero.next')}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-8 lg:absolute lg:bottom-8 lg:left-1/2 lg:-translate-x-1/2">
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentSlide ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-label={t('home.hero.goToSlide', { n: i + 1 })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoriesStrip({ categories }: { categories: Category[] }) {
  const { t } = useI18n();

  return (
    <section className="bg-ink-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide pb-2">
          <Link
            to="/shop"
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-ink-900 text-white rounded-full text-sm font-semibold hover:bg-ink-800 transition-colors"
          >
            {t('home.categories.all')}
          </Link>
          {categories.map(cat => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="shrink-0 px-5 py-2.5 bg-white border border-ink-200 rounded-full text-sm font-medium text-ink-700 hover:border-ink-900 hover:text-ink-900 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function DealsSection({ products }: { products: Product[] }) {
  const { t } = useI18n();

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-400 rounded-xl">
            <Zap className="w-6 h-6 text-ink-900" />
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">{t('home.deals.title')}</h2>
            <p className="text-ink-500 text-sm">{t('home.deals.subtitle')}</p>
          </div>
        </div>
        <Link to="/shop" className="text-sm font-semibold hover:underline">
          {t('home.deals.viewAll')} →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map(p => (
          <div key={p.id} className="relative">
            {p.compareAtPrice && (
              <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                -{Math.round((1 - p.price / p.compareAtPrice) * 100)}%
              </div>
            )}
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedSection({ products }: { products: Product[] }) {
  const { t } = useI18n();

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">{t('home.featured.title')}</h2>
          <p className="text-ink-500 mt-1">{t('home.featured.subtitle')}</p>
        </div>
        <Link to="/shop" className="text-sm font-semibold hover:underline">
          {t('home.featured.viewAll')} →
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function ValuePropsSection() {
  return (
    <section className="bg-ink-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-start gap-4 p-6 bg-white rounded-2xl">
            <div className="p-3 bg-ink-100 rounded-xl">
              <Truck className="w-6 h-6 text-ink-900" />
            </div>
            <div>
              <h3 className="font-bold mb-1">Free Shipping</h3>
              <p className="text-sm text-ink-500">On every order over $100, anywhere in the country.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-white rounded-2xl">
            <div className="p-3 bg-ink-100 rounded-xl">
              <Shield className="w-6 h-6 text-ink-900" />
            </div>
            <div>
              <h3 className="font-bold mb-1">Secure Payments</h3>
              <p className="text-sm text-ink-500">Industry-standard encryption, powered by Stripe.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-6 bg-white rounded-2xl">
            <div className="p-3 bg-ink-100 rounded-xl">
              <Zap className="w-6 h-6 text-ink-900" />
            </div>
            <div>
              <h3 className="font-bold mb-1">30-day Returns</h3>
              <p className="text-sm text-ink-500">Not in love? Send it back, no questions asked.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}