import { Router, Request, Response } from 'express';
import { StoreSettings } from '../models/index.js';

const router = Router();

// Fallback used only if a StoreSettings row already exists from before this
// data was set as the column default (e.g. an admin opened Settings once
// while bankTransferDetails was still {}). Keeps old, already-empty rows
// from permanently shadowing the real Pagomóvil data.
const DEFAULT_PAGOMOVIL = {
  bankName: '0102',
  accountNumber: '04129253568',
  documentId: '30246814',
};

// Public, read-only, and deliberately narrow: only the fields the storefront
// needs (e.g. bank transfer details for the manual payment gateway). Never
// expose the full StoreSettings row here — that stays admin-only.
router.get('/', async (_req: Request, res: Response) => {
  try {
    // If nobody has ever opened Admin → Settings, no row exists yet.
    // Create it here too so the column defaults (Pagomóvil data) show up
    // on the very first checkout, not only after an admin visits Settings.
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({} as any);
    }

    let bankTransferDetails = settings.bankTransferDetails;
    const isEmpty = !bankTransferDetails
      || (!bankTransferDetails.bankName && !bankTransferDetails.accountNumber && !bankTransferDetails.documentId);
    if (isEmpty) {
      settings.bankTransferDetails = DEFAULT_PAGOMOVIL;
      await settings.save();
      bankTransferDetails = DEFAULT_PAGOMOVIL;
    }

    res.json({
      storeName: settings.storeName ?? null,
      contactEmail: settings.contactEmail ?? null,
      logoUrl: settings.logoUrl ?? null,
      bankTransferDetails,
    });
  } catch (error) {
    console.error('Public settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

export default router;