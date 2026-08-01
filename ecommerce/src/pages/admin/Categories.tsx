import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { categoriesApi, adminApi, type Category } from '../../lib/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast } from '../../components/admin/Toast';
import { useConfirm } from '../../components/admin/ConfirmDialog';
import { useI18n } from '../../i18n/I18nContext';

export default function Categories() {
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({
    slug: '',
    image: '',
    isVisible: true,
    translations: {
      es: { name: '', description: '' },
      en: { name: '', description: '' },
    } as { es: { name: string; description: string }; en: { name: string; description: string } },
  });
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const loadCategories = () => {
    categoriesApi.getAll()
      .then(res => setCategories(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCategories(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      slug: '',
      image: '',
      isVisible: true,
      translations: { es: { name: '', description: '' }, en: { name: '', description: '' } },
    });
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    const tr = (cat.translations ?? {}) as any;
    setForm({
      slug: cat.slug,
      image: cat.image || '',
      isVisible: cat.isVisible !== false,
      translations: {
        es: { name: tr.es?.name ?? cat.name, description: tr.es?.description ?? cat.description ?? '' },
        en: { name: tr.en?.name ?? cat.name, description: tr.en?.description ?? cat.description ?? '' },
      },
    });
    setShowForm(true);
  };

  const handleNameChange = (lang: 'es' | 'en', name: string) => {
    setForm(f => {
      const next = { ...f, translations: { ...f.translations, [lang]: { ...f.translations[lang], name } } };
      if (lang === 'en' && !f.slug) {
        next.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
      return next;
    });
  };

  const updateTr = (lang: 'es' | 'en', field: 'name' | 'description', value: string) => {
    setForm(f => ({
      ...f,
      translations: { ...f.translations, [lang]: { ...f.translations[lang], [field]: value } },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        slug: form.slug,
        image: form.image,
        isVisible: form.isVisible,
        translations: form.translations,
      };
      if (editing) {
        await adminApi.updateCategory(editing.id, payload as any);
        toast.success(t('admin.categories.update.success'));
      } else {
        await adminApi.createCategory(payload as any);
        toast.success(t('admin.categories.create.success'));
      }
      setShowForm(false);
      setEditing(null);
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('admin.categories.save') + ' failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    const ok = await confirm({
      title: 'Delete category',
      message: `Delete "${cat.name}"? Move or delete its products first.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.deleteCategory(cat.id);
      toast.success('Category deleted');
      loadCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const toggleVisibility = async (cat: Category) => {
    try {
      await adminApi.updateCategory(cat.id, { isVisible: !(cat.isVisible !== false) });
      loadCategories();
    } catch (err: any) {
      toast.error('Visibility update failed');
    }
  };

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const order = categories.map(c => c.id);
    const fromIdx = order.indexOf(dragId);
    const toIdx = order.indexOf(targetId);
    order.splice(fromIdx, 1);
    order.splice(toIdx, 0, dragId);
    setDragId(null);
    try {
      await Promise.all(order.map((id, idx) =>
        adminApi.updateCategory(id, { sortOrder: idx })
      ));
      toast.success('Order saved');
      loadCategories();
    } catch (err) {
      toast.error('Reorder failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-white rounded w-1/3 animate-pulse" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description={`${categories.length} categor${categories.length === 1 ? 'y' : 'ies'}`}
        actions={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add category
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-ink-200 rounded-2xl p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{editing ? t('admin.categories.editCategory') : t('admin.categories.newCategory')}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-ink-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">{t('admin.categories.slug')} *</label>
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                required
                className="input-base font-mono text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">{t('admin.categories.image')}</label>
              <input
                type="url"
                value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                placeholder={t('admin.categories.imagePlaceholder')}
                className="input-base"
              />
              {form.image && (
                <img
                  src={form.image}
                  alt="Preview"
                  onError={e => { e.currentTarget.style.opacity = '0.3'; }}
                  className="mt-2 w-32 h-32 object-cover rounded-lg border border-ink-200"
                />
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
              ES · {t('admin.categories.name')} {t('admin.categories.description')}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="text"
                value={form.translations.es.name}
                onChange={e => handleNameChange('es', e.target.value)}
                placeholder="Accesorios"
                className="input-base"
              />
              <input
                type="text"
                value={form.translations.es.description}
                onChange={e => updateTr('es', 'description', e.target.value)}
                placeholder="Esenciales refinados para cargar, conectar y organizar."
                className="input-base"
              />
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">
              EN · {t('admin.categories.name')} {t('admin.categories.description')}
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="text"
                value={form.translations.en.name}
                onChange={e => handleNameChange('en', e.target.value)}
                placeholder="Accessories"
                required
                className="input-base"
              />
              <input
                type="text"
                value={form.translations.en.description}
                onChange={e => updateTr('en', 'description', e.target.value)}
                placeholder="Refined essentials for carrying, charging, and connecting."
                className="input-base"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isVisible}
              onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">{t('admin.categories.visible')}</span>
          </label>
          <div className="flex gap-3 pt-2 border-t border-ink-200">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              {t('admin.categories.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? t('admin.categories.saving') : (editing ? t('admin.categories.update') : t('admin.categories.create'))}
            </button>
          </div>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div
            key={cat.id}
            draggable
            onDragStart={() => handleDragStart(cat.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(cat.id)}
            className={`bg-white border border-ink-200 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing transition-opacity ${dragId === cat.id ? 'opacity-50' : ''}`}
          >
            <div className="aspect-[16/9] bg-ink-100 overflow-hidden">
              {cat.image && (
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  onError={e => { e.currentTarget.style.opacity = '0.3'; }}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold text-lg truncate">{cat.name}</h3>
                  {cat.isVisible === false && (
                    <span className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                      <EyeOff className="w-3 h-3" />
                      Hidden
                    </span>
                  )}
                </div>
                <button
                  onClick={() => toggleVisibility(cat)}
                  className="p-1.5 hover:bg-ink-100 rounded-lg shrink-0"
                  title={cat.isVisible !== false ? 'Hide' : 'Show'}
                  aria-label={cat.isVisible !== false ? 'Hide category' : 'Show category'}
                >
                  {cat.isVisible !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-ink-400" />}
                </button>
              </div>
              <p className="text-sm text-ink-500 mt-1 line-clamp-2">{cat.description}</p>
              <p className="text-xs text-ink-400 mt-2 font-mono">{cat.slug}</p>
              <p className="text-sm mt-2">{cat.productCount} products</p>
              <div className="flex items-center gap-2 mt-4">
                <button onClick={() => openEdit(cat)} className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-1">
                  <Edit className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => handleDelete(cat)} className="btn-secondary text-red-600 hover:bg-red-50 flex-1 text-sm py-2 flex items-center justify-center gap-1">
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-ink-200">
          <p className="text-ink-500">No categories yet. Create your first one.</p>
        </div>
      )}
    </div>
  );
}