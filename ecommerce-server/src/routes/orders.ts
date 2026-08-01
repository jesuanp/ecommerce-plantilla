import { Router, Response } from 'express';
import { Order, OrderItem, Product } from '../models/index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

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

export default router;
