import { AuditLog } from '../models/index';
import type { AuthRequest } from '../middleware/auth';

export async function logAudit(
  req: AuthRequest | null,
  action: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await AuditLog.create({
      userId: req?.user?.id,
      userEmail: req?.user?.email,
      action,
      resourceType: resourceType ?? null,
      resourceId: resourceId ?? null,
      metadata: metadata || {},
    } as any);
  } catch (err) {
    console.error('logAudit failed:', err);
  }
}