import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { productsApi, categoriesApi, type Product, type Category } from '../lib/api';

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export default function ShopPage() {
  const [params, setParams] = useSearchParams();
  const initialCategory = params.get('category') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(params.get('q') || '');
  const [sort, setSort] = useState<SortKey>('featured');
  const [priceMax, setPriceMax] = useState(400);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    Promise.all([
      productsApi.getAll({ category: category || undefined, q: query || undefined, sort, maxPrice: priceMax }),
      categoriesApi.getAll(),
    ])
      .then(([productsRes, categoriesRes]) => {
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, query, sort, priceMax]);

  useEffect(() => {
    setCategory(params.get('category') || '');
    setQuery(params.get('q') || '');
  }, [params]);

  const filtered = useMemo<Product[]>(() => {
    let res = [...products];
    if (query) {
      const q = query.toLowerCase();
      res = res.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    return res;
  }, [products, query]);

  const updateCategory = (slug: string) => {
    if (slug === category) return;
    setCategory(slug);
    if (slug === '') {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    setParams(params);
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    setParams(params);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-ink-100 rounded w-1/4" />
          <div className="h-4 bg-ink-100 rounded w-1/6" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Shop</h1>
          <p className="mt-1 text-ink-500">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            {query && ` for "${query}"`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden btn-secondary"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="input-base py-2 w-auto"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to high</option>
            <option value="price-desc">Price: High to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className={`${showFilters ? 'block' : 'hidden lg:block'} space-y-6`}>
          <div className="bg-ink-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Category</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden p-1 hover:bg-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => updateCategory('')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  category === ''
                    ? 'bg-ink-900 text-white font-medium'
                    : 'hover:bg-white'
                }`}
              >
                All products
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => updateCategory(c.slug)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category === c.slug
                      ? 'bg-ink-900 text-white font-medium'
                      : 'hover:bg-white'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-ink-100 rounded-2xl p-5">
            <h3 className="font-semibold mb-3">Max price</h3>
            <input
              type="range"
              min={50}
              max={400}
              step={10}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-ink-900"
            />
            <div className="flex items-center justify-between text-sm text-ink-500 mt-1">
              <span>$0</span>
              <span className="font-semibold text-ink-900">${priceMax}</span>
            </div>
          </div>

          <div className="bg-ink-100 rounded-2xl p-5">
            <h3 className="font-semibold mb-3">Search</h3>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Find a product…"
              className="input-base py-2"
            />
          </div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-ink-100 rounded-2xl">
              <p className="text-2xl mb-2">🤔</p>
              <h3 className="font-semibold">No products found</h3>
              <p className="text-ink-500 mt-1">Try a different search or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filtered.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
