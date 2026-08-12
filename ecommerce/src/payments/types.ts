import type { ReactNode } from 'react';

export type PaymentMode = 'redirect' | 'inline' | 'manual' | 'demo';

export interface PaymentCustomer {
  name: string;
  email: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface PaymentItem {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface PaymentContext {
  amount: number;
  currency: string;
  items: PaymentItem[];
  customer: PaymentCustomer;
  orderId?: string;
  userId?: string | null;
  isGuest: boolean;
  metadata?: Record<string, any>;
}

export interface PaymentFormSubmitPayload {
  token?: string;
  paymentReference?: string;
  paymentProofUrl?: string;
}

export interface PaymentInitResult {
  mode: PaymentMode;
  redirectUrl?: string;
  inlineComponent?: ReactNode;
  reference?: string;
  paymentMethodKey: string;
  paymentReference?: string;
  paymentProofUrl?: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'failed';

export interface PaymentReturnResult {
  status: PaymentStatus;
  reference?: string;
}

export interface PaymentFormProps {
  context: PaymentContext;
  onSubmit: (payload: PaymentFormSubmitPayload) => void | Promise<void>;
  onCancel?: () => void;
}

export interface PaymentGateway {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  mode: PaymentMode;
  isEnabled: () => boolean;
  init: (ctx: PaymentContext) => Promise<PaymentInitResult>;
  handleReturn?: (params: URLSearchParams) => Promise<PaymentReturnResult>;
  renderForm?: (props: PaymentFormProps) => ReactNode;
}