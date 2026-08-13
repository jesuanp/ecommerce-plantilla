import { useEffect, useRef, useState } from 'react';
import { Building2, Copy, Upload, Check, X } from 'lucide-react';
// import { uploadApi } from '../../lib/api';
import { useToast } from '../../components/admin/Toast';
import type {
  PaymentContext,
  PaymentFormProps,
  PaymentGateway,
  PaymentInitResult,
} from '../types';

const BANK_INFO = {
  name: import.meta.env.VITE_BANK_NAME || 'Banco: 0102',
  account: import.meta.env.VITE_BANK_ACCOUNT || 'C.I: 30123456',
  phone: import.meta.env.VITE_BANK_PHONE || 'Tel: 0412123456',
};

export const bankTransferGateway: PaymentGateway = {
  id: 'bank_transfer',
  label: 'Transferencia bancaria',
  description: 'Realiza una transferencia y sube tu comprobante para confirmar el pago.',
  icon: <Building2 className="w-5 h-5" />,
  mode: 'manual',
  isEnabled: () => true,

  init: async (_ctx: PaymentContext): Promise<PaymentInitResult> => {
    return {
      mode: 'manual',
      paymentMethodKey: 'bank_transfer',
    };
  },

  renderForm: ({ context, onSubmit, onCancel }: PaymentFormProps) => (
    <BankTransferForm context={context} onSubmit={onSubmit} onCancel={onCancel} />
  ),
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* sigue al fallback */
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText =
      'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function BankTransferForm({ onCancel }: PaymentFormProps) {
  const toast = useToast();
  const [reference, setReference] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [manualCopy, setManualCopy] = useState<string | null>(null);

  const fields = [
    { key: 'name', label: 'Banco', value: BANK_INFO.name },
    { key: 'account', label: 'C.I', value: BANK_INFO.account },
    { key: 'phone', label: 'Teléfono', value: BANK_INFO.phone },
  ];

  const tryCopy = async (rawValue: string, key: string) => {
    const valueOnly = rawValue.replace(/^[^:]+:\s*/, '').trim();
    const ok = await copyToClipboard(valueOnly);
    if (ok) {
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 1500);
      toast.success('Datos copiados al portapapeles');
    } else {
      toast.error('Tu navegador bloqueó el copiado automático');
      setManualCopy(valueOnly);
    }
  };

  const copyAll = async () => {
    const values = fields
      .map(f => f.value.replace(/^[^:]+:\s*/, '').trim())
      .join(' ');
    await tryCopy(values, 'all');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!reference.trim()) {
      setError('Ingresa el número de referencia del pago.');
      return;
    }
    if (!proofFile) {
      setError('Adjunta el capture del comprobante.');
      return;
    }
    setSubmitting(true);
    try {
      // const res = await uploadApi.uploadFile(proofFile, 'payments');
      // await onSubmit({
      //   paymentReference: reference.trim(),
      //   paymentProofUrl: res.data.url,
      // });
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'No se pudo subir el comprobante.');
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-ink-200">
        <div className="bg-ink-100 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm">Datos para la transferencia</h3>
            <button
              type="button"
              onClick={copyAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-ink-200 rounded-md text-xs font-medium hover:bg-ink-50"
            >
              {copiedField === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-600" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copiar todo
                </>
              )}
            </button>
          </div>
          {fields.map(f => (
            <div
              key={f.key}
              className="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs text-ink-500">{f.label}</p>
                <p className="font-mono text-sm truncate">{f.value}</p>
              </div>
              <button
                type="button"
                onClick={() => tryCopy(f.value, f.key)}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-ink-100 text-xs"
                aria-label={`Copiar ${f.label}`}
              >
                {copiedField === f.key ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-ink-500" />
                )}
              </button>
            </div>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">
            Número de referencia
          </label>
          <input
            type="text"
            value={reference}
            onChange={e => setReference(e.target.value)}
            required
            className="input-base"
            placeholder="Ej: 123456789"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">
            Comprobante de pago (capture)
          </label>
          <label className="flex items-center justify-center gap-2 px-4 py-6 bg-ink-100 border-2 border-dashed border-ink-200 rounded-xl cursor-pointer hover:bg-ink-50">
            <Upload className="w-5 h-5 text-ink-500" />
            <span className="text-sm text-ink-700">
              {proofFile ? proofFile.name : 'Subir imagen del comprobante'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={e => setProofFile(e.target.files?.[0] ?? null)}
              required
              className="hidden"
            />
          </label>
          {proofFile && (
            <p className="text-xs text-ink-500 mt-1">
              {(proofFile.size / 1024).toFixed(0)} KB
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={submitting}
          >
            {submitting ? 'Subiendo comprobante…' : 'Confirmar pago'}
          </button>
        </div>
      </form>

      {manualCopy !== null && (
        <ManualCopyModal text={manualCopy} onClose={() => setManualCopy(null)} />
      )}
    </>
  );
}

function ManualCopyModal({ text, onClose }: { text: string; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const selectAll = () => {
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Copia manualmente</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-ink-100 rounded-lg"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-ink-500">
          Tu navegador no permite copiar automáticamente. Mantén pulsado el texto
          de abajo y elige <strong>Copiar</strong>.
        </p>
        <input
          ref={inputRef}
          readOnly
          value={text}
          onFocus={e => e.currentTarget.select()}
          onClick={selectAll}
          className="input-base font-mono text-sm"
        />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={selectAll} className="btn-secondary text-sm">
            Seleccionar todo
          </button>
          <button type="button" onClick={onClose} className="btn-primary text-sm">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}