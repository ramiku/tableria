import { activityFeed, desc, eq, users, type Db } from '@tableria/db';

export type ActivityType =
  | 'friend_request'
  | 'friend_accepted'
  | 'invited'
  | 'your_turn'
  | 'tournament_round_started'
  | 'tournament_eliminated';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  payload: unknown;
  createdAt: Date;
  actor: { id: string; username: string; displayName: string; avatarInitial: string | null; avatarColor: string | null };
}

export async function record(db: Db, actorUserId: string, targetUserId: string, type: ActivityType, payload: unknown): Promise<void> {
  await db.insert(activityFeed).values({ actorUserId, targetUserId, type, payload });
}

export async function listForUser(db: Db, userId: string, limit = 20): Promise<ActivityEntry[]> {
  const rows = await db
    .select({
      id: activityFeed.id,
      type: activityFeed.type,
      payload: activityFeed.payload,
      createdAt: activityFeed.createdAt,
      actorId: users.id,
      actorUsername: users.username,
      actorDisplayName: users.displayName,
      actorAvatarInitial: users.avatarInitial,
      actorAvatarColor: users.avatarColor,
    })
    .from(activityFeed)
    .innerJoin(users, eq(users.id, activityFeed.actorUserId))
    .where(eq(activityFeed.targetUserId, userId))
    .orderBy(desc(activityFeed.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    payload: r.payload,
    createdAt: r.createdAt,
    actor: {
      id: r.actorId,
      username: r.actorUsername,
      displayName: r.actorDisplayName,
      avatarInitial: r.actorAvatarInitial,
      avatarColor: r.actorAvatarColor,
    },
  }));
}
