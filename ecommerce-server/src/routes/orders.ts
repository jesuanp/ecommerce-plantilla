import { Router, Response } from 'express';
import { Order, OrderItem, Product } from '../models/index';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { makeUploader, PROOFS_SUBDIR, publicUrlFor } from '../lib/uploads';

const router = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const proofUploader = makeUploader(PROOFS_SUBDIR, [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user!.id },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
    });

    res.json(orders);
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }],
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if ((order as any).userId !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(order);
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { items, subtotal, shipping, tax, total, customer, paymentMethod, stripeSessionId } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ error: 'Order items are required' });
      return;
    }

    const order = await Order.create({
      userId: req.user!.id,
      status: 'pending',
      subtotal,
      shipping,
      tax,
      total,
      paymentMethod: paymentMethod || 'stripe',
      stripeSessionId,
      customerEmail: customer.email,
      shippingAddress: customer,
    } as any);

    for (const item of items) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId || null,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      } as any);

      if (item.productId) {
        const product = await Product.findByPk(item.productId);
        if (product && product.stock >= item.quantity) {
          product.stock -= item.quantity;
          await product.save();
        }
      }
    }

    const orderWithItems = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }],
    });

    res.status(201).json(orderWithItems);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Customer uploads their bank transfer / deposit proof for an order they own.
// The order must already exist (created as 'pending') and belong to the
// authenticated user (or be accessed by an admin).
router.post(
  '/:id/payment-proof',
  authenticateToken,
  proofUploader.single('proof'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!UUID_REGEX.test(req.params.id)) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      const order = await Order.findByPk(req.params.id);
      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if ((order as any).userId !== req.user!.id && req.user!.role !== 'admin') {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'A proof file (image or PDF) is required' });
        return;
      }

      order.paymentProofUrl = publicUrlFor(PROOFS_SUBDIR, req.file.filename);
      order.paymentProofUploadedAt = new Date();
      await order.save();

      res.json(order);
    } catch (error) {
      console.error('Payment proof upload error:', error);
      res.status(500).json({ error: 'Failed to upload payment proof' });
    }
  }
);

export default router;