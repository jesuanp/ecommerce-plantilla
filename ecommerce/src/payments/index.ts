import { registerGateway } from './registry';
import { bankTransferGateway } from './gateways/bank-transfer';

// Only Pagomóvil is active for now. To bring back Stripe/demo later,
// import them again and call registerGateway() for each.
registerGateway(bankTransferGateway);

export * from './types';
export * from './registry';
export * from './PaymentGatewaysProvider';