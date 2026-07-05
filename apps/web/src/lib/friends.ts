import { trpc } from './trpc';
import { usePresenceStore, type PresenceValue } from '../stores/presence';

export interface FriendWithPresence {
  userId: string;
  username: string;
  displayName: string;
  avatarInitial: string | null;
  avatarColor: string | null;
  presence: PresenceValue;
  lastSeenAt: string | null;
}

/** Amigos del usuario con la presencia más reciente conocida (sondeo inicial de tRPC, luego el store en vivo por WS). */
export function useFriendsList() {
  const query = trpc.friends.list.useQuery();
  const byUserId = usePresenceStore((s) => s.byUserId);

  const friends: FriendWithPresence[] = (query.data ?? []).map((f) => {
    const live = byUserId[f.userId];
    return { ...f, presence: live?.presence ?? f.presence, lastSeenAt: live?.lastSeenAt ?? f.lastSeenAt };
  });

  return { ...query, friends };
}
