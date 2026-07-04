import { useTranslation } from 'react-i18next';
import { Avatar, type Presence } from './Avatar';
import { ChatIcon } from './icons';

export interface Friend {
  id: string;
  name: string;
  initial: string;
  color: string;
  presence: Presence;
  status: string;
}

type PresenceKey = 'online' | 'away' | 'offline';

// Vive exclusivamente en el sidebar (franja de marca fija, siempre oscura)
export function FriendRow({ friend }: { friend: Friend }) {
  const { t } = useTranslation();
  const presenceKey = friend.presence as PresenceKey;
  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-tb-sidebar-bg-2">
      <Avatar initial={friend.initial} color={friend.color} presence={friend.presence} size={32} tone="sidebar" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-tb-sidebar-text">{friend.name}</p>
        <p className="truncate text-xs text-tb-sidebar-muted">
          {friend.status || t(`presence.${presenceKey}`)}
        </p>
      </div>
      <button
        type="button"
        aria-label={t('friendRow.chatWith', { name: friend.name })}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-tb-sidebar-muted opacity-0 transition-opacity hover:text-tb-sidebar-accent group-hover:opacity-100 focus-visible:opacity-100"
      >
        <ChatIcon />
      </button>
    </div>
  );
}
