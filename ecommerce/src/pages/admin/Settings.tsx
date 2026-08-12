import { useEffect, useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { adminApi, type StoreSettings } from '../../lib/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useToast } from '../../components/admin/Toast';

const TABS = ['general', 'shipping', 'tax', 'payments'] as const;

export default function Settings() {
  const toast = useToast();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<typeof TABS[number]>('general');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings()
      .then(res => setSettings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const save = async (patch: Partial<StoreSettings>) => {
    setSaving(true);
    try {
      const res = await adminApi.updateSettings(patch);
      setSettings(res.data);
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-white rounded w-1/3 animate-pulse" />
        <div className="h-64 bg-white rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Settings" description="Store configuration" />

      <div className="mb-4 flex gap-2 border-b border-ink-200 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors whitespace-nowrap ${
              tab === t ? 'border-ink-900 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white border border-ink-200 rounded-2xl p-6">
        {tab === 'general' && (
          <GeneralTab settings={settings} onSave={save} saving={saving} />
        )}
        {tab === 'shipping' && (
          <ShippingTab settings={settings} onSave={save} saving={saving} />
        )}
        {tab === 'tax' && (
          <TaxTab settings={settings} onSave={save} saving={saving} />
        )}
        {tab === 'payments' && (
          <PaymentsTab settings={settings} onSave={save} saving={saving} />
        )}
      </div>
    </div>
  );
}

function GeneralTab({ settings, onSave, saving }: any) {
  const [storeName, setStoreName] = useState(settings.storeName);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');

  return (
    <div className="space-y-4 max-w-2xl">
      <Field label="Store name">
        <input value={storeName} onChange={e => setStoreName(e.target.value)} className="input-base" />
      </Field>
      <Field label="Contact email">
        <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="input-base" />
      </Field>
      <Field label="Logo URL">
        <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="input-base" placeholder="https://..." />
      </Field>
      <button onClick={() => onSave({ storeName, contactEmail, logoUrl })} disabled={saving} className="btn-primary">
        <Save className="w-4 h-4" />
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}

function ShippingTab({ settings, onSave, saving }: any) {
  const [zones, setZones] = useState(settings.shippingZones || []);

  const update = (idx: number, patch: any) => {
    setZones(zones.map((z: any, i: number) => i === idx ? { ...z, ...patch } : z));
  };

  const add = () => setZones([...zones, { name: '', countries: [], rate: 0 }]);

  const remove = (idx: number) => setZones(zones.filter((_: any, i: number) => i !== idx));

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-500">Define shipping zones, allowed countries and flat rates.</p>
      {zones.length === 0 && <p className="text-sm text-ink-400">No zones yet.</p>}
      {zones.map((z: any, i: number) => (
        <div key={i} className="flex flex-wrap gap-3 p-4 bg-ink-100 rounded-xl">
          <input
            value={z.name}
            onChange={e => update(i, { name: e.target.value })}
            placeholder="Zone name (e.g. North America)"
            className="input-base py-2 flex-1 min-w-[180px]"
          />
          <input
            value={z.countries.join(', ')}
            onChange={e => update(i, { countries: e.target.value.split(',').map((s: string) => s.trim().toUpperCase()).filter(Boolean) })}
            placeholder="US, CA, MX"
            className="input-base py-2 flex-1 min-w-[180px]"
          />
          <input
            type="number"
            step="0.01"
            min="0"
            value={z.rate}
            onChange={e => update(i, { rate: parseFloat(e.target.value) || 0 })}
            placeholder="Rate"
            className="input-base py-2 w-24"
          />
          <button onClick={() => remove(i)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" aria-label="Remove zone">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex gap-3">
        <button onClick={add} className="btn-secondary"><Plus className="w-4 h-4" /> Add zone</button>
        <button onClick={() => onSave({ shippingZones: zones })} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save zones'}
        </button>
      </div>
    </div>
  );
}

function TaxTab({ settings, onSave, saving }: any) {
  const [rates, setRates] = useState<Record<string, number>>(settings.taxRates || {});

  return (
    <div className="space-y-4 max-w-md">
      <p className="text-sm text-ink-500">Tax rate (as decimal, e.g. 0.08 = 8%) applied by country code.</p>
      {Object.entries(rates).map(([country, rate]) => (
        <div key={country} className="flex items-center gap-3">
          <span className="font-mono w-12">{country}</span>
          <input
            type="number"
            step="0.001"
            min="0"
            max="1"
            value={rate}
            onChange={e => setRates({ ...rates, [country]: parseFloat(e.target.value) || 0 })}
            className="input-base py-2 flex-1"
          />
          <button
            onClick={() => {
              const next = { ...rates };
              delete next[country];
              setRates(next);
            }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
            aria-label="Remove rate"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => {
            const code = prompt('Country code (e.g. US, CA):');
            if (code) setRates({ ...rates, [code.toUpperCase()]: 0 });
          }}
          className="btn-secondary"
        >
          <Plus className="w-4 h-4" /> Add country
        </button>
        <button onClick={() => onSave({ taxRates: rates })} disabled={saving} className="btn-primary">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save rates'}
        </button>
      </div>
    </div>
  );
}

function PaymentsTab({ settings, onSave, saving }: any) {
  const [bank, setBank] = useState({
    bankName: settings.bankTransferDetails?.bankName || '',
    accountHolder: settings.bankTransferDetails?.accountHolder || '',
    accountNumber: settings.bankTransferDetails?.accountNumber || '',
    documentId: settings.bankTransferDetails?.documentId || '',
    instructions: settings.bankTransferDetails?.instructions || '',
  });

  const saveBank = () => onSave({ bankTransferDetails: bank });

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <p className="text-sm text-ink-500">Payment processor configuration is managed via environment variables.</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-3">
          <div className="p-4 bg-ink-100 rounded-xl">
            <p className="font-medium">Stripe</p>
            <p className="text-xs text-ink-500 mt-1">STRIPE_SECRET_KEY</p>
            <p className="text-xs text-ink-400 mt-0.5">STRIPE_WEBHOOK_SECRET</p>
          </div>
          <div className="p-4 bg-ink-100 rounded-xl">
            <p className="font-medium">Demo mode</p>
            <p className="text-xs text-ink-500 mt-1">
              When STRIPE_SECRET_KEY is empty, checkout uses a simulated flow that completes without real payment.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-ink-200 space-y-4">
        <div>
          <p className="font-medium">Pagomóvil</p>
          <p className="text-xs text-ink-500 mt-1">
            Se muestra al cliente cuando llega al paso de pago en el checkout, justo después de crear su orden como pendiente.
          </p>
        </div>

        <Field label="Banco">
          <input
            value={bank.bankName}
            onChange={e => setBank(b => ({ ...b, bankName: e.target.value }))}
            className="input-base"
            placeholder="Banco Industrial"
          />
        </Field>
        <Field label="Titular">
          <input
            value={bank.accountHolder}
            onChange={e => setBank(b => ({ ...b, accountHolder: e.target.value }))}
            className="input-base"
            placeholder="EG Connects, S.A."
          />
        </Field>
        <Field label="Teléfono (Pagomóvil)">
          <input
            value={bank.accountNumber}
            onChange={e => setBank(b => ({ ...b, accountNumber: e.target.value }))}
            className="input-base"
            placeholder="0414-1234567"
          />
        </Field>
        <Field label="Cédula / RIF">
          <input
            value={bank.documentId}
            onChange={e => setBank(b => ({ ...b, documentId: e.target.value }))}
            className="input-base"
            placeholder="V-12345678"
          />
        </Field>
        <Field label="Instrucciones extra para el cliente">
          <textarea
            value={bank.instructions}
            onChange={e => setBank(b => ({ ...b, instructions: e.target.value }))}
            rows={3}
            className="input-base"
            placeholder="Envía también tu comprobante por WhatsApp para una confirmación más rápida."
          />
        </Field>

        <button onClick={saveBank} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Guardando…' : 'Guardar datos de Pagomóvil'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      {children}
    </div>
  );
}