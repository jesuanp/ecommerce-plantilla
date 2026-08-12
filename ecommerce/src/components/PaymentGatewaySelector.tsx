import { useEffect, useState } from 'react';
import { CreditCard, Lock } from 'lucide-react';
import { usePaymentGateways } from '../payments';
import { formatPrice } from '../lib/utils';
import type {
  PaymentContext,
  PaymentFormSubmitPayload,
  PaymentGateway,
  PaymentInitResult,
} from '../payments/types';

export interface PaymentGatewaySelectorProps {
  context: PaymentContext;
  onResult: (result: PaymentInitResult, gateway: PaymentGateway) => void | Promise<void>;
  onBack?: () => void;
}

export default function PaymentGatewaySelector({
  context,
  onResult,
  onBack,
}: PaymentGatewaySelectorProps) {
  const { available } = usePaymentGateways();
  const [selectedId, setSelectedId] = useState<string | null>(
    available[0]?.id ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inlineNode, setInlineNode] = useState<PaymentInitResult['inlineComponent']>(null);

  useEffect(() => {
    if (!selectedId && available.length > 0) {
      setSelectedId(available[0].id);
    }
  }, [available, selectedId]);

  const selected = available.find(g => g.id === selectedId) ?? null;
  const hasForm = !!selected?.renderForm;

  const pay = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    setInlineNode(null);
    try {
      const result = await selected.init(context);

      if (result.mode === 'redirect' && result.redirectUrl) {
        await onResult(result, selected);
        window.location.href = result.redirectUrl;
        return;
      }

      if (result.mode === 'inline' && result.inlineComponent) {
        setInlineNode(result.inlineComponent);
        setLoading(false);
        return;
      }

      await onResult(result, selected);
      setLoading(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Payment failed';
      setError(msg);
      setLoading(false);
    }
  };

  const handleFormSubmit = async (payload: PaymentFormSubmitPayload) => {
    if (!selected) return;
    setError('');
    try {
      const result = await selected.init(context);
      const merged: PaymentInitResult = {
        ...result,
        paymentReference: payload.paymentReference ?? result.paymentReference,
        paymentProofUrl: payload.paymentProofUrl ?? result.paymentProofUrl,
      };
      await onResult(merged, selected);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Payment failed');
    }
  };

  const handleFormCancel = () => {
    setInlineNode(null);
  };

  if (available.length === 0) {
    return (
      <div className="bg-white border border-ink-200 rounded-2xl p-6 text-center">
        <p className="text-ink-500">No payment methods are available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-ink-200 rounded-2xl p-6 space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-ink-200">
        <div className="w-10 h-10 rounded-full bg-ink-100 grid place-items-center">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Payment</h2>
          <p className="text-sm text-ink-500">Choose how you'd like to pay</p>
        </div>
      </div>

      <div className="space-y-2">
        {available.map(g => {
          const isActive = g.id === selectedId;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedId(g.id)}
              className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                isActive
                  ? 'border-ink-900 bg-ink-100'
                  : 'border-ink-200 hover:border-ink-400'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-white grid place-items-center border border-ink-200 shrink-0">
                {g.icon ?? <Lock className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{g.label}</p>
                {g.description && (
                  <p className="text-xs text-ink-500 mt-0.5">{g.description}</p>
                )}
              </div>
              <span
                className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                  isActive ? 'bg-ink-900 border-ink-900' : 'border-ink-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {selected && selected.mode === 'demo' && (
        <p className="text-xs text-ink-500 text-center">
          Demo mode — no real payment will be processed.
        </p>
      )}

      {selected && selected.mode === 'redirect' && !hasForm && (
        <p className="text-xs text-ink-500 text-center">
          You'll be redirected to complete payment securely.
        </p>
      )}

      {hasForm && selected && (
        <div className="pt-2 border-t border-ink-200">
          {selected.renderForm!({
            context,
            onSubmit: handleFormSubmit,
            onCancel: handleFormCancel,
          })}
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
      )}

      {!hasForm && inlineNode && (
        <div className="pt-2 border-t border-ink-200">{inlineNode}</div>
      )}

      {!hasForm && error && <p className="text-sm text-red-600">{error}</p>}

      {!hasForm && (
        <div className="flex gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary"
              disabled={loading}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={pay}
            className="btn-primary flex-1"
            disabled={loading || !selected}
          >
            {loading ? 'Processing…' : selected?.mode === 'demo'
              ? `Simulate payment ${formatPrice(context.amount, context.currency)}`
              : `Pay ${formatPrice(context.amount, context.currency)}`}
          </button>
        </div>
      )}
    </div>
  );
}