import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Save, TicketPercent } from 'lucide-react';
import { adminApi, type Promotion } from '../../lib/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast } from '../../components/admin/Toast';
import { useConfirm } from '../../components/admin/ConfirmDialog';

const TYPE_LABEL: Record<Promotion['type'], string> = {
  percent: 'Percentage',
  fixed: 'Fixed amount',
  free_shipping: 'Free shipping',
};

function formatValue(p: Promotion): string {
  if (p.type === 'percent') return `${p.value}%`;
  if (p.type === 'fixed') return `$${p.value}`;
  return 'Free shipping';
}

export default function Promotions() {
  const toast = useToast();
  const confirm = useConfirm();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState({
    code: '',
    type: 'percent' as Promotion['type'],
    value: 0,
    appliesTo: 'all' as Promotion['appliesTo'],
    maxUses: '',
    maxUsesPerUser: '',
    startsAt: '',
    expiresAt: '',
    isActive: true,
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    adminApi.getPromotions()
      .then(res => setPromotions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: '',
      type: 'percent',
      value: 0,
      appliesTo: 'all',
      maxUses: '',
      maxUsesPerUser: '',
      startsAt: '',
      expiresAt: '',
      isActive: true,
      description: '',
    });
    setShowForm(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      code: p.code,
      type: p.type,
      value: p.value,
      appliesTo: p.appliesTo,
      maxUses: p.maxUses?.toString() || '',
      maxUsesPerUser: p.maxUsesPerUser?.toString() || '',
      startsAt: p.startsAt ? p.startsAt.slice(0, 16) : '',
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 16) : '',
      isActive: p.isActive,
      description: p.description || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const data: any = {
      code: form.code.toUpperCase().trim(),
      type: form.type,
      value: form.type === 'free_shipping' ? 0 : Number(form.value),
      appliesTo: form.appliesTo,
      maxUses: form.maxUses ? parseInt(form.maxUses) : null,
      maxUsesPerUser: form.maxUsesPerUser ? parseInt(form.maxUsesPerUser) : null,
      startsAt: form.startsAt || null,
      expiresAt: form.expiresAt || null,
      isActive: form.isActive,
      description: form.description,
    };
    try {
      if (editing) {
        await adminApi.updatePromotion(editing.id, data);
        toast.success('Promotion updated');
      } else {
        await adminApi.createPromotion(data);
        toast.success('Promotion created');
      }
      setShowForm(false);
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Promotion) => {
    const ok = await confirm({
      title: 'Delete promotion',
      message: `Delete code "${p.code}"?`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await adminApi.deletePromotion(p.id);
      toast.success('Promotion deleted');
      load();
    } catch (err: any) {
      toast.error('Delete failed');
    }
  };

  const isExpired = (p: Promotion) => p.expiresAt && new Date(p.expiresAt) < new Date();
  const isScheduled = (p: Promotion) => p.startsAt && new Date(p.startsAt) > new Date();

  return (
    <div>
      <AdminPageHeader
        title="Promotions"
        description="Discount codes and coupons"
        actions={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add promotion
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-ink-200 rounded-2xl p-6 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">{editing ? 'Edit promotion' : 'New promotion'}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 hover:bg-ink-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Code *</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
                className="input-base font-mono uppercase"
                placeholder="SUMMER25"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Type *</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                className="input-base"
              >
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
                <option value="free_shipping">Free shipping</option>
              </select>
            </div>
          </div>
          {form.type !== 'free_shipping' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-1.5">Value *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))}
                  required
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Applies to</label>
                <select
                  value={form.appliesTo}
                  onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value as any }))}
                  className="input-base"
                >
                  <option value="all">All products</option>
                  <option value="category">Specific category</option>
                  <option value="product">Specific product</option>
                </select>
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Max total uses</label>
              <input
                type="number"
                min="0"
                value={form.maxUses}
                onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                className="input-base"
                placeholder="Unlimited"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Max uses per user</label>
              <input
                type="number"
                min="0"
                value={form.maxUsesPerUser}
                onChange={e => setForm(f => ({ ...f, maxUsesPerUser: e.target.value }))}
                className="input-base"
                placeholder="Unlimited"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1.5">Starts at</label>
              <input
                type="datetime-local"
                value={form.startsAt}
                onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                className="input-base"
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1.5">Expires at</label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1.5">Internal description</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input-base"
              placeholder="Optional"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
          <div className="flex gap-3 pt-2 border-t border-ink-200">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse" />
          ))}
        </div>
      ) : promotions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-ink-200">
          <TicketPercent className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No promotions yet</p>
        </div>
      ) : (
        <div className="bg-white border border-ink-200 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-ink-100 text-sm">
              <tr>
                <th className="text-left p-4 font-semibold">Code</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-left p-4 font-semibold">Value</th>
                <th className="text-left p-4 font-semibold">Usage</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(p => (
                <tr key={p.id} className="border-t border-ink-100 hover:bg-ink-50">
                  <td className="p-4">
                    <p className="font-mono font-bold">{p.code}</p>
                    {p.description && <p className="text-xs text-ink-500 mt-0.5">{p.description}</p>}
                  </td>
                  <td className="p-4 text-sm">{TYPE_LABEL[p.type]}</td>
                  <td className="p-4 text-sm font-semibold">{formatValue(p)}</td>
                  <td className="p-4 text-sm">
                    {p.usedCount} / {p.maxUses || '∞'}
                  </td>
                  <td className="p-4">
                    {!p.isActive ? (
                      <span className="px-2 py-0.5 bg-ink-200 text-ink-700 rounded-full text-xs font-semibold">Inactive</span>
                    ) : isExpired(p) ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">Expired</span>
                    ) : isScheduled(p) ? (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Scheduled</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Active</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-2 hover:bg-ink-100 rounded-lg" aria-label="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg" aria-label="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}