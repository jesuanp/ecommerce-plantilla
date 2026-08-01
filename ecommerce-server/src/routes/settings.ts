import { Router } from 'express';
import { StoreSettings } from '../models/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';
import { logAudit } from '../lib/audit.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken, requireAdmin);

async function getOrCreate(): Promise<StoreSettings> {
  let s = await StoreSettings.findOne();
  if (!s) s = await StoreSettings.create({});
  return s;
}

router.get('/', async (_req, res) => {
  try {
    const settings = await getOrCreate();
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

router.put('/', async (req: AuthRequest, res) => {
  try {
    const settings = await getOrCreate();
    Object.assign(settings, req.body);
    await settings.save();
    await logAudit(req, 'settings.update', 'settings', settings.id);
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;