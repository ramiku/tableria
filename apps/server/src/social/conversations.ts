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
  type: 'direct' | 'group';
  otherUser: {
    id: string;
    username: string;
    displayName: string;
    avatarInitial: string | null;
    avatarColor: string | null;
  } | null;
  group: {
    name: string;
    avatarInitial: string | null;
    avatarColor: string | null;
    memberCount: number;
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

/** Miembros de una conversación (DM o grupo) — usado para el reparto de mensajes y de voz. */
export async function getMemberIds(db: Db, conversationId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: conversationMembers.userId })
    .from(conversationMembers)
    .where(eq(conversationMembers.conversationId, conversationId));
  return rows.map((r) => r.userId);
}

export async function createGroup(db: Db, creatorId: string, name: string, memberIds: string[]): Promise<string> {
  return db.transaction(async (tx) => {
    const [conv] = await tx
      .insert(conversations)
      .values({ type: 'group', name, createdBy: creatorId })
      .returning({ id: conversations.id });
    if (!conv) throw new Error('No se pudo crear el grupo');
    await tx.insert(conversationMembers).values([
      { conversationId: conv.id, userId: creatorId, role: 'admin' },
      ...memberIds.map((userId) => ({ conversationId: conv.id, userId, role: 'member' as const })),
    ]);
    return conv.id;
  });
}

export async function leaveGroup(db: Db, conversationId: string, userId: string): Promise<void> {
  await db
    .delete(conversationMembers)
    .where(and(eq(conversationMembers.conversationId, conversationId), eq(conversationMembers.userId, userId)));
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
    .select({
      id: conversations.id,
      type: conversations.type,
      name: conversations.name,
      avatarInitial: conversations.avatarInitial,
      avatarColor: conversations.avatarColor,
      lastReadAt: conversationMembers.lastReadAt,
    })
    .from(conversationMembers)
    .innerJoin(conversations, eq(conversations.id, conversationMembers.conversationId))
    .where(eq(conversationMembers.userId, meId))
    .orderBy(desc(conversations.lastMessageAt));

  if (myConvs.length === 0) return [];
  const convIds = myConvs.map((c) => c.id);
  const directIds = myConvs.filter((c) => c.type === 'direct').map((c) => c.id);
  const groupIds = myConvs.filter((c) => c.type === 'group').map((c) => c.id);

  // En una DM, "el otro" es una única fila por conversación; en un grupo no hay "el otro"
  // singular, por eso esta consulta se limita a las conversaciones directas.
  const others =
    directIds.length === 0
      ? []
      : await db
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
          .where(and(inArray(conversationMembers.conversationId, directIds), ne(conversationMembers.userId, meId)));
  const otherByConv = new Map(others.map((o) => [o.conversationId, o]));

  const memberCounts =
    groupIds.length === 0
      ? []
      : await db
          .select({ conversationId: conversationMembers.conversationId, n: sql<number>`count(*)::int` })
          .from(conversationMembers)
          .where(inArray(conversationMembers.conversationId, groupIds))
          .groupBy(conversationMembers.conversationId);
  const memberCountByConv = new Map(memberCounts.map((m) => [m.conversationId, m.n]));

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
    if (c.type === 'group') {
      return {
        id: c.id,
        type: 'group' as const,
        otherUser: null,
        group: {
          name: c.name ?? '',
          avatarInitial: c.avatarInitial,
          avatarColor: c.avatarColor,
          memberCount: memberCountByConv.get(c.id) ?? 0,
        },
        lastMessage: lastByConv.get(c.id) ?? null,
        unreadCount: unreadByConv.get(c.id) ?? 0,
      };
    }
    const other = otherByConv.get(c.id);
    return {
      id: c.id,
      type: 'direct' as const,
      otherUser: other ? { id: other.id, username: other.username, displayName: other.displayName, avatarInitial: other.avatarInitial, avatarColor: other.avatarColor } : null,
      group: null,
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
