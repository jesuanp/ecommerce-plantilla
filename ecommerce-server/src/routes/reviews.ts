import { Router } from 'express';
import { Review, Product, User } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { logAudit } from '../lib/audit.js';
import { Op } from 'sequelize';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/', async (req, res) => {
  try {
    const { status = 'pending', limit = 100 } = req.query;
    const where: any = {};
    if (status !== 'all') where.status = status;
    const reviews = await Review.findAll({
      where,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'images'] },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
    });
    res.json(reviews);
  } catch (error) {
    console.error('List reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    const { status, reply } = req.body;
    if (status !== undefined) review.status = status;
    if (reply !== undefined) review.reply = reply;
    await review.save();
    await logAudit(req, 'review.update', 'review', review.id, { status });
    res.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const review = await Review.findByPk(req.params.id);
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    await review.destroy();
    await logAudit(req, 'review.delete', 'review', req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;