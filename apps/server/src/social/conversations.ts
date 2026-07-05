import {
  and,
  conversationMembers,
  conversations,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  matches,
  messages,
  ne,
  or,
  sql,
  users,
  type Db,
} from '@tableria/db';

export interface ConversationSummary {
  id: string;
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatarInitial: string | null;
    avatarColor: string | null;
  } | null;
  lastMessage: { body: string; kind: string; createdAt: Date } | null;
  unreadCount: number;
}

export interface MessageEntry {
  id: string;
  userId: string | null;
  username: string | null;
  kind: 'text' | 'system' | 'invite';
  body: string;
  inviteMatchId: string | null;
  inviteMatchCode: string | null;
  createdAt: Date;
}

export async function isMember(db: Db, conversationId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.userId, userId)))
    .limit(1);
  return !!row;
}

export async function otherMemberId(db: Db, conversationId: string, meId: string): Promise<string | null> {
  const [row] = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(and(eq(conversationMembers.conversationId, conversationId), ne(conversationMembers.userId, meId)))
    .limit(1);
  return row?.userId ?? null;
}

export async function getOrCreateDirect(db: Db, meId: string, friendId: string): Promise<string> {
  const mine = await db
    .select({ id: conversationMembers.conversationId })
    .from(conversationMembers)
    .innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId))
    .where(and(eq(conversationMembers.userId, meId), eq(conversations.type, 'direct')));

  if (mine.length > 0) {
    const [shared] = await db
      .select({ id: conversationMembers.conversationId })
      .from(conversationMembers)
      .where(
        and(
          eq(conversationMembers.userId, friendId),
          inArray(
            conversationMembers.conversationId,
            mine.map((m) => m.id),
          ),
        ),
      )
      .limit(1);
    if (shared) return shared.id;
  }

  return db.transaction(async (tx) => {
    const [conv] = await tx.insert(conversations).values({ type: 'direct', createdBy: meId }).returning({ id: conversations.id });
    if (!conv) throw new Error('No se pudo crear la conversación');
    await tx.insert(conversationMembers).values([
      { conversationId: conv.id, userId: meId },
      { conversationId: conv.id, userId: friendId },
    ]);
    return conv.id;
  });
}

export async function listConversations(db: Db, meId: string): Promise<ConversationSummary[]> {
  const myConvs = await db
    .select({ id: conversations.id, lastReadAt: conversationMembers.lastReadAt })
    .from(conversationMembers)
    .innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId))
    .where(eq(conversationMembers.userId, meId))
    .orderBy(desc(conversations.lastMessageAt));

  if (myConvs.length === 0) return [];
  const convIds = myConvs.map((c) => c.id);

  const others = await db
    .select({
      conversationId: conversationMembers.conversationId,
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarInitial: users.avatarInitial,
      avatarColor: users.avatarColor,
    })
    .from(conversationMembers)
    .innerJoin(users, eq(users.id, conversationMembers.userId))
    .where(and(inArray(conversationMembers.conversationId, convIds), ne(conversationMembers.userId, meId)));
  const otherByConv = new Map(others.map((o) => [o.conversationId, o]));

  const lastMessages = await db
    .selectDistinctOn([messages.conversationId], {
      conversationId: messages.conversationId,
      body: messages.body,
      kind: messages.kind,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(inArray(messages.conversationId, convIds))
    .orderBy(messages.conversationId, desc(messages.createdAt));
  const lastByConv = new Map(lastMessages.map((m) => [m.conversationId, m]));

  const unreadCounts = await db
    .select({ conversationId: messages.conversationId, n: sql<number>`count(*)::int` })
    .from(messages)
    .innerJoin(
      conversationMembers,
      and(eq(conversationMembers.conversationId, messages.conversationId), eq(conversationMembers.userId, meId)),
    )
    .where(
      and(
        inArray(messages.conversationId, convIds),
        ne(messages.userId, meId),
        or(isNull(conversationMembers.lastReadAt), gt(messages.createdAt, conversationMembers.lastReadAt)),
      ),
    )
    .groupBy(messages.conversationId);
  const unreadByConv = new Map(unreadCounts.map((u) => [u.conversationId, u.n]));

  return myConvs.map((c) => {
    const other = otherByConv.get(c.id);
    return {
      id: c.id,
      otherUser: other ? { id: other.id, username: other.username, displayName: other.displayName, avatarInitial: other.avatarInitial, avatarColor: other.avatarColor } : null,
      lastMessage: lastByConv.get(c.id) ?? null,
      unreadCount: unreadByConv.get(c.id) ?? 0,
    };
  });
}

export async function listMessages(db: Db, conversationId: string, cursor?: Date, limit = 30): Promise<MessageEntry[]> {
  const rows = await db
    .select({
      id: messages.id,
      userId: messages.userId,
      username: users.username,
      kind: messages.kind,
      body: messages.body,
      inviteMatchId: messages.inviteMatchId,
      inviteMatchCode: matches.code,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .leftJoin(users, eq(users.id, messages.userId))
    .leftJoin(matches, eq(matches.id, messages.inviteMatchId))
    .where(cursor ? and(eq(messages.conversationId, conversationId), lt(messages.createdAt, cursor)) : eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse();
}

export async function markRead(db: Db, conversationId: string, userId: string): Promise<void> {
  await db
    .update(conversationMembers)
    .set({ lastReadAt: new Date() })
    .where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.userId, userId)));
}

export async function sendMessage(
  db: Db,
  conversationId: string,
  userId: string,
  body: string,
  kind: 'text' | 'invite',
  matchId?: string,
): Promise<MessageEntry> {
  return db.transaction(async (tx) => {
    let inviteMatchCode: string | null = null;
    if (kind === 'invite') {
      if (!matchId) throw new Error('Falta la partida a invitar');
      const [match] = await tx.select({ code: matches.code }).from(matches).where(eq(matches.id, matchId)).limit(1);
      if (!match) throw new Error('La partida no existe');
      inviteMatchCode = match.code;
    }

    const [inserted] = await tx
      .insert(messages)
      .values({ conversationId, userId, kind, body, inviteMatchId: kind === 'invite' ? matchId : null })
      .returning();
    if (!inserted) throw new Error('No se pudo enviar el mensaje');

    await tx.update(conversations).set({ lastMessageAt: inserted.createdAt }).where(eq(conversations.id, conversationId));

    const [sender] = await tx.select({ username: users.username }).from(users).where(eq(users.id, userId)).limit(1);

    return {
      id: inserted.id,
      userId: inserted.userId,
      username: sender?.username ?? null,
      kind: inserted.kind,
      body: inserted.body,
      inviteMatchId: inserted.inviteMatchId,
      inviteMatchCode,
      createdAt: inserted.createdAt,
    };
  });
}
