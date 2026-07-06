import { eq, users, type Db } from '@tableria/db';
import { logAdminAction } from '../admin/audit.js';
import { revokeAllSessions } from '../auth/session.js';

/**
 * "Banear" = suspender la cuenta por completo (no solo impedir jugar). Reutiliza
 * `users.disabledAt`/`disabledReason`, presentes desde el esquema inicial pero nunca
 * antes aplicados en ningún sitio: `getUserFromToken` los comprueba y mata la sesión
 * en el siguiente request/heartbeat; el login los comprueba tras verificar contraseña.
 */
export async function banUser(
  db: Db,
  params: { adminUserId: string; targetUserId: string; reason: string },
): Promise<void> {
  await db
    .update(users)
    .set({ disabledAt: new Date(), disabledReason: params.reason })
    .where(eq(users.id, params.targetUserId));
  await revokeAllSessions(db, params.targetUserId, 'admin_ban');

  await logAdminAction(db, {
    adminUserId: params.adminUserId,
    action: 'players.ban',
    targetType: 'user',
    targetId: params.targetUserId,
    detail: { reason: params.reason },
  });
}

export async function unbanUser(db: Db, params: { adminUserId: string; targetUserId: string }): Promise<void> {
  await db.update(users).set({ disabledAt: null, disabledReason: null }).where(eq(users.id, params.targetUserId));

  await logAdminAction(db, {
    adminUserId: params.adminUserId,
    action: 'players.unban',
    targetType: 'user',
    targetId: params.targetUserId,
  });
}
