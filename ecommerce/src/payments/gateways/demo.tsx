import { CreditCard } from 'lucide-react';
import type { PaymentContext, PaymentGateway, PaymentInitResult } from '../types';

export const demoGateway: PaymentGateway = {
  id: 'demo',
  label: 'Demo / Simulated',
  description: 'Simulated checkout — no real payment is processed.',
  icon: <CreditCard className="w-5 h-5" />,
  mode: 'demo',
  isEnabled: () => true,

  init: async (_ctx: PaymentContext): Promise<PaymentInitResult> => {
    return {
      mode: 'demo',
      reference: `demo_${Date.now()}`,
      paymentMethodKey: 'demo',
    };
  },
};