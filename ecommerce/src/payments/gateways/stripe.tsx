import { Lock } from 'lucide-react';
import { checkoutApi } from '../../lib/api';
import type {
  PaymentContext,
  PaymentGateway,
  PaymentInitResult,
} from '../types';

export const stripeGateway: PaymentGateway = {
  id: 'stripe',
  label: 'Credit / Debit Card',
  description: 'Pay securely with any major card via Stripe Checkout.',
  icon: <Lock className="w-5 h-5" />,
  mode: 'redirect',
  isEnabled: () => true,

  init: async (ctx: PaymentContext): Promise<PaymentInitResult> => {
    const res = await checkoutApi.createSession(ctx.items);
    const data = res.data;

    if (data.mode === 'demo') {
      return {
        mode: 'demo',
        reference: data.sessionId,
        paymentMethodKey: 'stripe',
      };
    }

    return {
      mode: 'redirect',
      redirectUrl: data.url,
      reference: data.sessionId,
      paymentMethodKey: 'stripe',
    };
  },
};