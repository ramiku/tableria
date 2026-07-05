import { and, desc, eq, isNull, notifications, type Db } from '@tableria/db';

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'invited'
  | 'your_turn'
  | 'tournament_round_started'
  | 'tournament_eliminated';

export interface NotificationEntry {
  id: string;
  type: NotificationType;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}

export async function create(db: Db, userId: string, type: NotificationType, payload: unknown): Promise<NotificationEntry> {
  const [row] = await db.insert(notifications).values({ userId, type, payload }).returning();
  if (!row) throw new Error('No se pudo crear la notificación');
  return row;
}

export async function list(db: Db, userId: string, limit = 30): Promise<NotificationEntry[]> {
  return db
    .select({
      id: notifications.id,
      type: notifications.type,
      payload: notifications.payload,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markRead(db: Db, userId: string, id: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllRead(db: Db, userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
