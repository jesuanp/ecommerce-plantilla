import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { productsApi, categoriesApi, adminApi, type Category } from '../../lib/api';
import ImageManager from '../../components/admin/ImageManager';
import { useI18n } from '../../i18n/I18nContext';

interface ProductTranslation {
  name: string;
  description: string;
  longDescription: string;
  brand: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
}

type Lang = 'es' | 'en';

function emptyTranslation(): ProductTranslation {
  return { name: '', description: '', longDescription: '', brand: '', tags: [], metaTitle: '', metaDescription: '' };
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { t } = useI18n();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    slug: '',
    categoryId: '',
    price: '',
    compareAtPrice: '',
    images: [] as string[],
    stock: '',
    rating: '',
    reviewCount: '',
    featured: false,
    isActive: true,
    translations: {
      es: emptyTranslation(),
      en: emptyTranslation(),
    } as Record<Lang, ProductTranslation>,
  });

  useEffect(() => {
    categoriesApi.getAll()
      .then(res => setCategories(res.data))
      .catch(console.error);

    if (isEditing && id) {
      productsApi.getById(id)
        .then(res => {
          const p = res.data.product;
          const tr = (p.translations ?? {}) as Partial<Record<Lang, Partial<ProductTranslation>>>;
          setForm({
            slug: p.slug ?? '',
            categoryId: p.category?.id || '',
            price: String(p.price ?? ''),
            compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
            images: Array.isArray(p.images) ? p.images : [],
            stock: String(p.stock ?? 0),
            rating: String(p.rating ?? 0),
            reviewCount: String(p.reviewCount ?? 0),
            featured: !!p.featured,
            isActive: p.isActive !== false,
            translations: {
              es: { ...emptyTranslation(), ...(tr.es || {}) } as ProductTranslation,
              en: { ...emptyTranslation(), ...(tr.en || {}) } as ProductTranslation,
            },
          });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleNameChange = (lang: Lang, value: string) => {
    setForm(f => {
      const next = { ...f, translations: { ...f.translations } };
      next.translations[lang] = { ...next.translations[lang], name: value };
      if (lang === 'en' && !f.slug) {
        next.slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
      return next;
    });
  };

  const updateTranslation = (lang: Lang, field: keyof ProductTranslation, value: string | string[]) => {
    setForm(f => ({
      ...f,
      translations: {
        ...f.translations,
        [lang]: { ...f.translations[lang], [field]: value },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const enName = form.translations.en.name.trim();
    const esName = form.translations.es.name.trim();
    if (!enName && !esName) {
      setError('Add at least one product name (EN or ES)');
      return;
    }
    if (form.images.length === 0) {
      setError(t('admin.productForm.noImages'));
      return;
    }

    setSaving(true);

    const cleanTranslation = (tr: ProductTranslation): ProductTranslation => ({
      name: tr.name.trim(),
      description: tr.description.trim(),
      longDescription: tr.longDescription.trim(),
      brand: tr.brand.trim(),
      tags: tr.tags.filter(Boolean),
      metaTitle: tr.metaTitle.trim(),
      metaDescription: tr.metaDescription.trim(),
    });

    const data: any = {
      slug: form.slug || (enName || esName).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      price: parseFloat(form.price),
      images: form.images,
      categoryId: form.categoryId,
      stock: parseInt(form.stock) || 0,
      rating: parseFloat(form.rating) || 0,
      reviewCount: parseInt(form.reviewCount) || 0,
      featured: form.featured,
      isActive: form.isActive,
      translations: {
        es: cleanTranslation(form.translations.es),
        en: cleanTranslation(form.translations.en),
      },
    };

    if (form.compareAtPrice) {
      data.compareAtPrice = parseFloat(form.compareAtPrice);
    }

    try {
      if (isEditing && id) {
        await adminApi.updateProduct(id, data);
      } else {
        await adminApi.createProduct(data);
      }
      navigate('/admin/products');
    } catch (err: any) {
      setError(err.response?.data?.error || t('admin.productForm.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ink-200 rounded w-1/4" />
          <div className="h-64 bg-white rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => navigate('/admin/products')}
        className="flex items-center gap-2 text-ink-500 hover:text-ink-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('admin.productForm.back')}
      </button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditing ? t('admin.productForm.edit') : t('admin.productForm.new')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-ink-200 rounded-2xl p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className="input-base font-mono text-sm"
              placeholder="auto-generated from EN name"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('admin.productForm.category')} *</label>
            <select
              value={form.categoryId}
              onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              required
              className="input-base"
            >
              <option value="">{t('admin.productForm.selectCategory')}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <BilingualField
          lang="es"
          labelKey="admin.productForm.langEs"
          fieldKey="name"
          value={form.translations.es.name}
          placeholder="Aurora Audífonos Inalámbricos"
          required={false}
          onChange={(v) => handleNameChange('es', v)}
        />
        <BilingualField
          lang="en"
          labelKey="admin.productForm.langEn"
          fieldKey="name"
          value={form.translations.en.name}
          placeholder="Aurora Wireless Headphones"
          required
          onChange={(v) => handleNameChange('en', v)}
        />

        <BilingualField
          lang="es"
          labelKey="admin.productForm.langEs"
          fieldKey="brand"
          value={form.translations.es.brand}
          placeholder="Raybert Audio"
          onChange={(v) => updateTranslation('es', 'brand', v)}
        />
        <BilingualField
          lang="en"
          labelKey="admin.productForm.langEn"
          fieldKey="brand"
          value={form.translations.en.brand}
          placeholder="Raybert Audio"
          onChange={(v) => updateTranslation('en', 'brand', v)}
        />

        <BilingualTextarea
          lang="es"
          labelKey="admin.productForm.langEs"
          fieldKey="description"
          value={form.translations.es.description}
          placeholder="Descripción corta del producto"
          rows={2}
          onChange={(v) => updateTranslation('es', 'description', v)}
        />
        <BilingualTextarea
          lang="en"
          labelKey="admin.productForm.langEn"
          fieldKey="description"
          value={form.translations.en.description}
          placeholder="Short product description"
          rows={2}
          onChange={(v) => updateTranslation('en', 'description', v)}
        />

        <BilingualTextarea
          lang="es"
          labelKey="admin.productForm.langEs"
          fieldKey="longDescription"
          value={form.translations.es.longDescription}
          placeholder="Descripción larga del producto…"
          rows={4}
          onChange={(v) => updateTranslation('es', 'longDescription', v)}
        />
        <BilingualTextarea
          lang="en"
          labelKey="admin.productForm.langEn"
          fieldKey="longDescription"
          value={form.translations.en.longDescription}
          placeholder="Long product description…"
          rows={4}
          onChange={(v) => updateTranslation('en', 'longDescription', v)}
        />

        <BilingualTagsField
          lang="es"
          labelKey="admin.productForm.langEs"
          value={form.translations.es.tags}
          onChange={(v) => updateTranslation('es', 'tags', v)}
        />
        <BilingualTagsField
          lang="en"
          labelKey="admin.productForm.langEn"
          value={form.translations.en.tags}
          onChange={(v) => updateTranslation('en', 'tags', v)}
        />

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('admin.productForm.price')} *</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              required
              className="input-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('admin.productForm.compareAtPrice')}</label>
            <input
              type="number"
              step="0.01"
              value={form.compareAtPrice}
              onChange={e => setForm(f => ({ ...f, compareAtPrice: e.target.value }))}
              className="input-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('admin.productForm.stock')} *</label>
            <input
              type="number"
              value={form.stock}
              onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
              required
              className="input-base"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">{t('admin.productForm.images')} *</label>
          <ImageManager
            value={form.images}
            onChange={urls => setForm(f => ({ ...f, images: urls }))}
            max={10}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('admin.productForm.rating')}</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={form.rating}
              onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
              className="input-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">{t('admin.productForm.reviewCount')}</label>
            <input
              type="number"
              value={form.reviewCount}
              onChange={e => setForm(f => ({ ...f, reviewCount: e.target.value }))}
              className="input-base"
            />
          </div>
          <div className="flex flex-col gap-2 pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">{t('admin.productForm.featured')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">{t('admin.productForm.active')}</span>
            </label>
          </div>
        </div>

        <details className="border border-ink-200 rounded-xl">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none">
            {t('admin.productForm.seo')}
          </summary>
          <div className="px-4 pb-4 space-y-3 border-t border-ink-200 pt-3">
            <BilingualField
              lang="es"
              labelKey="admin.productForm.langEs"
              fieldKey="metaTitle"
              value={form.translations.es.metaTitle}
              placeholder={t('admin.productForm.metaTitleHint')}
              onChange={(v) => updateTranslation('es', 'metaTitle', v)}
            />
            <BilingualField
              lang="en"
              labelKey="admin.productForm.langEn"
              fieldKey="metaTitle"
              value={form.translations.en.metaTitle}
              placeholder={t('admin.productForm.metaTitleHint')}
              onChange={(v) => updateTranslation('en', 'metaTitle', v)}
            />
            <BilingualTextarea
              lang="es"
              labelKey="admin.productForm.langEs"
              fieldKey="metaDescription"
              value={form.translations.es.metaDescription}
              placeholder={t('admin.productForm.metaDescriptionHint')}
              rows={2}
              onChange={(v) => updateTranslation('es', 'metaDescription', v)}
            />
            <BilingualTextarea
              lang="en"
              labelKey="admin.productForm.langEn"
              fieldKey="metaDescription"
              value={form.translations.en.metaDescription}
              placeholder={t('admin.productForm.metaDescriptionHint')}
              rows={2}
              onChange={(v) => updateTranslation('en', 'metaDescription', v)}
            />
          </div>
        </details>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2 border-t border-ink-200">
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary">
            {t('admin.productForm.cancel')}
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? t('admin.productForm.saving') : (isEditing ? t('admin.productForm.update') : t('admin.productForm.save'))}
          </button>
        </div>
      </form>
    </div>
  );
}

function BilingualField({
  lang,
  labelKey,
  fieldKey,
  value,
  placeholder,
  required,
  onChange,
}: {
  lang: 'es' | 'en';
  labelKey: string;
  fieldKey: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  onChange: (v: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
          <span className="inline-block w-8 text-center rounded bg-ink-100 text-ink-700">{lang.toUpperCase()}</span>
          {t(labelKey)} {t(`admin.productForm.${fieldKey}`)}
          {required && <span className="text-red-600">*</span>}
        </label>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          required={required}
          placeholder={placeholder}
          className="input-base"
        />
      </div>
    </div>
  );
}

function BilingualTextarea({
  lang,
  labelKey,
  fieldKey,
  value,
  placeholder,
  rows = 3,
  onChange,
}: {
  lang: 'es' | 'en';
  labelKey: string;
  fieldKey: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (v: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
          <span className="inline-block w-8 text-center rounded bg-ink-100 text-ink-700">{lang.toUpperCase()}</span>
          {t(labelKey)} {t(`admin.productForm.${fieldKey}`)}
        </label>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="input-base"
        />
      </div>
    </div>
  );
}

function BilingualTagsField({
  lang,
  labelKey,
  value,
  onChange,
}: {
  lang: 'es' | 'en';
  labelKey: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
          <span className="inline-block w-8 text-center rounded bg-ink-100 text-ink-700">{lang.toUpperCase()}</span>
          {t(labelKey)} {t('admin.productForm.tags')}
        </label>
        <input
          type="text"
          value={value.join(', ')}
          onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          placeholder={t('admin.productForm.tagsPlaceholder')}
          className="input-base"
        />
      </div>
    </div>
  );
}