import { adminAuditLog, desc, type Db } from '@tableria/db';

export interface AdminAuditEntry {
  adminUserId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: unknown;
}

/** Punto único de escritura del registro de auditoría del panel de admin. */
export async function logAdminAction(db: Db, entry: AdminAuditEntry): Promise<void> {
  await db.insert(adminAuditLog).values({
    adminUserId: entry.adminUserId,
    action: entry.action,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    detail: entry.detail ?? null,
  });
}

export async function listAdminAuditLog(db: Db, limit = 100) {
  return db
    .select()
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(limit);
}
