import { Landmark } from 'lucide-react';
import type { PaymentContext, PaymentGateway, PaymentInitResult } from '../types';

// mode: 'manual' — per the payments README, the order is created as
// 'pending' right away and stays that way until an admin verifies the
// proof of payment (uploaded right after order creation in CheckoutPage)
// and moves the order to 'paid'.
export const bankTransferGateway: PaymentGateway = {
  id: 'bank_transfer',
  label: 'Pagomovil',
  description: 'Paga por Pagomóvil y sube tu comprobante.',
  icon: <Landmark className="w-5 h-5" />,
  mode: 'manual',
  isEnabled: () => (import.meta.env.VITE_BANK_TRANSFER_ENABLED ?? 'true') !== 'false',

  init: async (_ctx: PaymentContext): Promise<PaymentInitResult> => {
    return {
      mode: 'manual',
      reference: `bt_${Date.now()}`,
      paymentMethodKey: 'bank_transfer',
    };
  },
};