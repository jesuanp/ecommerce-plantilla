import type { PaymentGateway } from './types';

const gateways = new Map<string, PaymentGateway>();

export const registerGateway = (gateway: PaymentGateway): void => {
  gateways.set(gateway.id, gateway);
};

export const unregisterGateway = (id: string): void => {
  gateways.delete(id);
};

export const getGateway = (id: string): PaymentGateway | undefined => {
  return gateways.get(id);
};

export const listGateways = (): PaymentGateway[] => {
  return Array.from(gateways.values());
};

export const listAvailableGateways = (): PaymentGateway[] => {
  return listGateways().filter(g => g.isEnabled());
};