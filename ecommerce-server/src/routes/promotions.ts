import { Router } from 'express';
import { Promotion } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { logAudit } from '../lib/audit.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, requireAdmin);

router.get('/', async (_req, res) => {
  try {
    const promotions = await Promotion.findAll({ order: [['createdAt', 'DESC']] });
    res.json(promotions);
  } catch (error) {
    console.error('List promotions error:', error);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const promo = await Promotion.create(req.body);
    await logAudit(req, 'promotion.create', 'promotion', promo.id, { code: promo.code });
    res.status(201).json(promo);
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const promo = await Promotion.findByPk(req.params.id);
    if (!promo) {
      res.status(404).json({ error: 'Promotion not found' });
      return;
    }
    Object.assign(promo, req.body);
    await promo.save();
    await logAudit(req, 'promotion.update', 'promotion', promo.id, { code: promo.code });
    res.json(promo);
  } catch (error) {
    console.error('Update promotion error:', error);
    res.status(500).json({ error: 'Failed to update promotion' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const promo = await Promotion.findByPk(req.params.id);
    if (!promo) {
      res.status(404).json({ error: 'Promotion not found' });
      return;
    }
    const code = promo.code;
    await promo.destroy();
    await logAudit(req, 'promotion.delete', 'promotion', req.params.id, { code });
    res.json({ message: 'Promotion deleted' });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
});

export default router;