import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { optionalAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2025-06-30.basil' as any }) : null;

router.post(
  '/create-checkout-session',
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!stripe) {
        return res.json({
          mode: 'demo',
          url: `${req.headers.origin}/order-success?simulated=1&session_id=demo_${Date.now()}`,
        });
      }

      const { items } = req.body as {
        items: { name: string; price: number; quantity: number; image: string; productId?: string }[];
      };

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      const lineItems = items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: `${req.headers.origin}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/checkout?canceled=1`,
        shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'MX', 'ES'] },
        customer_email: req.user?.email,
        metadata: {
          userId: req.user?.id || '',
        },
      });

      return res.json({ mode: 'stripe', url: session.url, sessionId: session.id });
    } catch (err) {
      console.error('Stripe error:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(500).json({ error: message });
    }
  }
);

router.get('/session-status', async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.json({ status: 'demo', payment_status: 'paid' });
    }

    const sessionId = req.query.session_id as string;
    if (!sessionId) return res.status(400).json({ error: 'Missing session_id' });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return res.json({
      status: session.status,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Could not retrieve session' });
  }
});

export default router;
