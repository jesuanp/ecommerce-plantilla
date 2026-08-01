import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { listGateways, listAvailableGateways } from './registry';
import type { PaymentGateway } from './types';

interface PaymentGatewaysContextValue {
  all: PaymentGateway[];
  available: PaymentGateway[];
  get: (id: string) => PaymentGateway | undefined;
}

const PaymentGatewaysContext = createContext<PaymentGatewaysContextValue | null>(null);

interface PaymentGatewaysProviderProps {
  children: ReactNode;
}

export function PaymentGatewaysProvider({ children }: PaymentGatewaysProviderProps) {
  const value = useMemo<PaymentGatewaysContextValue>(() => ({
    all: listGateways(),
    available: listAvailableGateways(),
    get: (id) => listGateways().find(g => g.id === id),
  }), []);

  return (
    <PaymentGatewaysContext.Provider value={value}>
      {children}
    </PaymentGatewaysContext.Provider>
  );
}

export function usePaymentGateways(): PaymentGatewaysContextValue {
  const ctx = useContext(PaymentGatewaysContext);
  if (!ctx) {
    throw new Error('usePaymentGateways must be used within a PaymentGatewaysProvider');
  }
  return ctx;
}

export function usePaymentGateway(id: string): PaymentGateway | undefined {
  const { get } = usePaymentGateways();
  return get(id);
}