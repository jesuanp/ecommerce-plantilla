import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoriesApi, type Category } from '../lib/api';
import { useI18n } from '../i18n/I18nContext';
import { pickTranslation } from '../i18n/translate';

export default function CategoriesPage() {
  const { t, locale } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoriesApi.getAll()
      .then(res => setCategories(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-ink-100 rounded w-1/4 mx-auto" />
        </div>
      </div>
    );
  }

return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">{t('categories.title')}</h1>
        <p className="mt-2 text-ink-500">{t('categories.description')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {categories.map(cat => {
          const tr = pickTranslation(cat.translations, locale);
          const displayName = tr?.name ?? cat.name;
          const displayDescription = tr?.description ?? cat.description;
          return (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              className="group relative aspect-[16/9] rounded-2xl overflow-hidden card-hover"
            >
              <img
                src={cat.image}
                alt={displayName}
                loading="lazy"
                onError={e => { e.currentTarget.style.opacity = '0.3'; }}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <h2 className="font-bold text-2xl">{displayName}</h2>
                <p className="text-sm text-white/80 mt-1">{displayDescription}</p>
                <p className="text-xs text-white/60 mt-2">{t('categories.count', { count: cat.productCount })}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
