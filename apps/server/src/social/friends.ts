import { and, eq, friendships, ilike, ne, or, users, type Db } from '@tableria/db';

/** `friendships` guarda una sola fila por pareja, siempre en orden canónico userId < friendId. */
export function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

function otherUserId(row: { userId: string; friendId: string }, meId: string): string {
  return row.userId === meId ? row.friendId : row.userId;
}

export interface FriendProfile {
  userId: string;
  username: string;
  displayName: string;
  avatarInitial: string | null;
  avatarColor: string | null;
  presence: 'online' | 'away' | 'in_game' | 'offline';
  lastSeenAt: Date | null;
}

async function profilesFor(db: Db, userIds: string[]): Promise<Map<string, FriendProfile>> {
  if (userIds.length === 0) return new Map();
  const rows = await db
    .select({
      userId: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarInitial: users.avatarInitial,
      avatarColor: users.avatarColor,
      presence: users.presence,
      lastSeenAt: users.lastSeenAt,
    })
    .from(users)
    .where(or(...userIds.map((id) => eq(users.id, id))));
  return new Map(rows.map((r) => [r.userId, r]));
}

/** Búsqueda en vivo para el cuadro de "añadir amigo" — por nick o nombre, excluyéndome a mí mismo. */
export async function searchUsers(db: Db, meId: string, query: string): Promise<FriendProfile[]> {
  const like = `%${query}%`;
  return db
    .select({
      userId: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarInitial: users.avatarInitial,
      avatarColor: users.avatarColor,
      presence: users.presence,
      lastSeenAt: users.lastSeenAt,
    })
    .from(users)
    .where(and(ne(users.id, meId), or(ilike(users.username, like), ilike(users.displayName, like))))
    .orderBy(users.username)
    .limit(8);
}

export async function listFriendIds(db: Db, meId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: friendships.userId, friendId: friendships.friendId })
    .from(friendships)
    .where(and(or(eq(friendships.userId, meId), eq(friendships.friendId, meId)), eq(friendships.status, 'accepted')));
  return rows.map((r) => otherUserId(r, meId));
}

export async function listFriends(db: Db, meId: string): Promise<FriendProfile[]> {
  const ids = await listFriendIds(db, meId);
  const profiles = await profilesFor(db, ids);
  return ids.map((id) => profiles.get(id)).filter((p): p is FriendProfile => !!p);
}

export interface PendingRequest {
  profile: FriendProfile;
  createdAt: Date;
}

export async function listPending(db: Db, meId: string): Promise<{ incoming: PendingRequest[]; outgoing: PendingRequest[] }> {
  const rows = await db
    .select({ userId: friendships.userId, friendId: friendships.friendId, actorId: friendships.actorId, createdAt: friendships.createdAt })
    .from(friendships)
    .where(and(or(eq(friendships.userId, meId), eq(friendships.friendId, meId)), eq(friendships.status, 'pending')));

  const otherIds = rows.map((r) => otherUserId(r, meId));
  const profiles = await profilesFor(db, otherIds);

  const incoming: PendingRequest[] = [];
  const outgoing: PendingRequest[] = [];
  for (const row of rows) {
    const profile = profiles.get(otherUserId(row, meId));
    if (!profile) continue;
    const entry = { profile, createdAt: row.createdAt };
    if (row.actorId === meId) outgoing.push(entry);
    else incoming.push(entry);
  }
  return { incoming, outgoing };
}

export async function listBlocked(db: Db, meId: string): Promise<FriendProfile[]> {
  const rows = await db
    .select({ userId: friendships.userId, friendId: friendships.friendId, actorId: friendships.actorId })
    .from(friendships)
    .where(and(or(eq(friendships.userId, meId), eq(friendships.friendId, meId)), eq(friendships.status, 'blocked')));
  const blockedByMe = rows.filter((r) => r.actorId === meId);
  const profiles = await profilesFor(db, blockedByMe.map((r) => otherUserId(r, meId)));
  return blockedByMe.map((r) => profiles.get(otherUserId(r, meId))).filter((p): p is FriendProfile => !!p);
}

export async function areFriends(db: Db, a: string, b: string): Promise<boolean> {
  const [userId, friendId] = canonicalPair(a, b);
  const [row] = await db
    .select({ status: friendships.status })
    .from(friendships)
    .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)))
    .limit(1);
  return row?.status === 'accepted';
}

export type SendRequestResult = { outcome: 'sent' } | { outcome: 'auto_accepted' } | { outcome: 'already_friends' };

/** Si el otro usuario ya te había enviado una solicitud, la mutua se acepta al instante. */
export async function sendFriendRequest(db: Db, meId: string, targetUserId: string): Promise<SendRequestResult> {
  if (meId === targetUserId) throw new Error('No puedes enviarte una solicitud a ti mismo');
  const [userId, friendId] = canonicalPair(meId, targetUserId);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(friendships)
      .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)))
      .for('update');

    if (!existing) {
      await tx.insert(friendships).values({ userId, friendId, status: 'pending', actorId: meId });
      return { outcome: 'sent' };
    }

    if (existing.status === 'accepted') return { outcome: 'already_friends' };

    if (existing.status === 'blocked') {
      if (existing.actorId === meId) throw new Error('Desbloquea al usuario antes de enviar una solicitud');
      throw new Error('No puedes enviar una solicitud a este usuario');
    }

    // status === 'pending'
    if (existing.actorId === meId) throw new Error('Ya le has enviado una solicitud');

    await tx
      .update(friendships)
      .set({ status: 'accepted', actorId: meId, respondedAt: new Date() })
      .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)));
    return { outcome: 'auto_accepted' };
  });
}

export async function respondFriendRequest(db: Db, meId: string, otherUserId: string, accept: boolean): Promise<boolean> {
  const [userId, friendId] = canonicalPair(meId, otherUserId);
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(friendships)
      .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)))
      .for('update');
    if (!existing || existing.status !== 'pending' || existing.actorId === meId) return false;

    if (accept) {
      await tx
        .update(friendships)
        .set({ status: 'accepted', actorId: meId, respondedAt: new Date() })
        .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)));
    } else {
      await tx.delete(friendships).where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)));
    }
    return true;
  });
}

export async function cancelFriendRequest(db: Db, meId: string, otherUserId: string): Promise<boolean> {
  const [userId, friendId] = canonicalPair(meId, otherUserId);
  const rows = await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.userId, userId),
        eq(friendships.friendId, friendId),
        eq(friendships.status, 'pending'),
        eq(friendships.actorId, meId),
      ),
    )
    .returning({ userId: friendships.userId });
  return rows.length > 0;
}

export async function removeFriend(db: Db, meId: string, otherUserId: string): Promise<boolean> {
  const [userId, friendId] = canonicalPair(meId, otherUserId);
  const rows = await db
    .delete(friendships)
    .where(and(eq(friendships.userId, userId), eq(friendships.friendId, friendId), eq(friendships.status, 'accepted')))
    .returning({ userId: friendships.userId });
  return rows.length > 0;
}

export async function blockUser(db: Db, meId: string, otherUserId: string): Promise<void> {
  const [userId, friendId] = canonicalPair(meId, otherUserId);
  await db
    .insert(friendships)
    .values({ userId, friendId, status: 'blocked', actorId: meId, respondedAt: new Date() })
    .onConflictDoUpdate({
      target: [friendships.userId, friendships.friendId],
      set: { status: 'blocked', actorId: meId, respondedAt: new Date() },
    });
}

export async function unblockUser(db: Db, meId: string, otherUserId: string): Promise<boolean> {
  const [userId, friendId] = canonicalPair(meId, otherUserId);
  const rows = await db
    .delete(friendships)
    .where(
      and(
        eq(friendships.userId, userId),
        eq(friendships.friendId, friendId),
        eq(friendships.status, 'blocked'),
        eq(friendships.actorId, meId),
      ),
    )
    .returning({ userId: friendships.userId });
  return rows.length > 0;
}
