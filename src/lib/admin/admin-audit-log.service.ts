import { db } from '@white-shop/db';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/utils/logger';

export type AdminAuditLogInput = {
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

/** Persists an admin audit event (best-effort — never blocks the main action). */
export async function writeAdminAuditLog(input: AdminAuditLogInput): Promise<void> {
  try {
    await db.adminAuditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    logger.error('[ADMIN AUDIT] Failed to write audit log', { input, error });
  }
}
