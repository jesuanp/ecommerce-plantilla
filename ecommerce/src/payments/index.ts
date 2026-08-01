import { registerGateway } from './registry';
import { demoGateway } from './gateways/demo';
import { stripeGateway } from './gateways/stripe';

registerGateway(demoGateway);
registerGateway(stripeGateway);

export * from './types';
export * from './registry';
export * from './PaymentGatewaysProvider';