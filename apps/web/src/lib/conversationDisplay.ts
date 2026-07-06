export interface ConversationLike {
  type: 'direct' | 'group';
  otherUser: { username: string; displayName: string; avatarInitial: string | null; avatarColor: string | null } | null;
  group: { name: string; avatarInitial: string | null; avatarColor: string | null; memberCount: number } | null;
}

export interface ConversationDisplay {
  kind: 'direct' | 'group';
  name: string;
  initial: string;
  color: string;
  /** Solo en DMs. */
  username: string | null;
  /** Solo en grupos. */
  memberCount: number | null;
}

/** Nombre/avatar a pintar tanto para una DM (el otro usuario) como para un grupo (su propio nombre/avatar). */
export function getConversationDisplay(c: ConversationLike | undefined, fallbackName: string): ConversationDisplay {
  if (c?.type === 'group') {
    const name = c.group?.name || fallbackName;
    return {
      kind: 'group',
      name,
      initial: c.group?.avatarInitial ?? name.charAt(0).toUpperCase(),
      color: c.group?.avatarColor ?? '#2f6fe0',
      username: null,
      memberCount: c.group?.memberCount ?? null,
    };
  }
  const other = c?.otherUser ?? null;
  const name = other?.displayName ?? fallbackName;
  return {
    kind: 'direct',
    name,
    initial: other?.avatarInitial ?? name.charAt(0).toUpperCase(),
    color: other?.avatarColor ?? '#2f6fe0',
    username: other?.username ?? null,
    memberCount: null,
  };
}
