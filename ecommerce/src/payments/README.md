# Payments — Sistema de pasarelas plug-in

Capa de abstracción que permite agregar o quitar pasarelas de pago **sin tocar `CheckoutPage`** ni la API del backend.

## Estructura

```
src/payments/
  types.ts                      ← contratos: PaymentGateway, PaymentContext, ...
  registry.ts                   ← registerGateway, getGateway, listAvailableGateways
  PaymentGatewaysProvider.tsx   ← provider + hooks (usePaymentGateways, usePaymentGateway)
  index.ts                      ← barrel + auto-registro de gateways built-in
  gateways/
    demo.tsx                    ← simulada (mode: 'demo')
    stripe.tsx                  ← Stripe Checkout (mode: 'redirect' con fallback a demo)
```

## Flujo

1. `CheckoutPage` muestra `<PaymentGatewaySelector>` en el paso "payment".
2. El selector lista los gateways que registren `isEnabled() === true`.
3. Al pagar, llama a `gateway.init(context)`.
4. Según `result.mode`:
   - `redirect` → redirige a `result.redirectUrl`.
   - `inline` → monta `result.inlineComponent`.
   - `manual` / `demo` → resuelve sin redirigir y crea la orden en backend.
5. `OrderSuccessPage` lee `paymentMethodKey` del payload pendiente y crea la orden.

## Cómo agregar una nueva pasarela en 4 pasos

> Ejemplo: agregar PayPal.

### 1. Crear `src/payments/gateways/paypal.tsx`

```tsx
import { Lock } from 'lucide-react';
import type {
  PaymentContext,
  PaymentGateway,
  PaymentInitResult,
} from '../types';

export const paypalGateway: PaymentGateway = {
  id: 'paypal',
  label: 'PayPal',
  description: 'Pay with your PayPal account.',
  icon: <Lock className="w-5 h-5" />,
  mode: 'redirect',
  isEnabled: () => Boolean(import.meta.env.VITE_PAYPAL_CLIENT_ID),

  init: async (ctx: PaymentContext): Promise<PaymentInitResult> => {
    const res = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: ctx.amount, currency: ctx.currency }),
    });
    const { approvalUrl, token } = await res.json();
    return {
      mode: 'redirect',
      redirectUrl: approvalUrl,
      reference: token,
      paymentMethodKey: 'paypal',
    };
  },
};
```

### 2. Registrar en `src/payments/index.ts`

```ts
import { paypalGateway } from './gateways/paypal';

registerGateway(paypalGateway);
```

### 3. (Opcional) Variable de entorno

Agregar a `.env.example` y `.env`:

```
VITE_PAYPAL_CLIENT_ID=
```

### 4. (Opcional) Persistir la orden

`paymentMethodKey` viaja en `pending.paymentMethodKey` hasta `OrderSuccessPage`,
donde `ordersApi.create()` lo envía al backend con `paymentMethod: 'paypal'`.
Tu backend ya persiste `Order.paymentMethod` como `string`, no requiere cambios.

## Tipos de modo

| mode        | Cuándo usarlo                                    | Qué debe devolver `init()`              |
|-------------|--------------------------------------------------|-----------------------------------------|
| `redirect`  | Stripe, PayPal, MercadoPago, Wompi…              | `{ redirectUrl, reference }`            |
| `inline`    | Stripe Elements, tarjeta en la misma página      | `{ inlineComponent }` (ReactNode)       |
| `manual`    | Transferencia bancaria, OXXO, contraentrega     | `{ reference }` (la orden queda `pending`) |
| `demo`      | Plantilla / modo prueba                         | `{ reference }` (simulación)            |

## `isEnabled()` — cómo ocultar pasarelas

`isEnabled()` decide si el gateway aparece en el selector. Úsalo para:

- Feature flags (`VITE_PAYPAL_ENABLED === 'true'`).
- Disponibilidad regional (`ctx.metadata?.country`).
- Settings por cliente (en una versión futura desde Admin → Settings).

## Multi-moneda

`PaymentContext.currency` se propaga al backend vía `amount`. Hoy Checkout usa `USD`;
cuando agregues multi-moneda, léelo del store y pásalo en `paymentContext.currency`.