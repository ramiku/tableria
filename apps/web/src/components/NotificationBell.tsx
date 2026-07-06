import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';
import { useNotificationsStore, type NotificationItem } from '../stores/notifications';
import { BellIcon } from './icons';

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = useNotificationsStore((s) => s.items);
  const setInitial = useNotificationsStore((s) => s.setInitial);
  const markReadLocal = useNotificationsStore((s) => s.markRead);
  const markAllReadLocal = useNotificationsStore((s) => s.markAllRead);

  const { data } = trpc.notifications.list.useQuery();
  useEffect(() => {
    if (data) setInitial(data);
  }, [data, setInitial]);

  const markReadMutation = trpc.notifications.markRead.useMutation();
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation();

  const unreadCount = items.filter((n) => !n.readAt).length;

  function describe(item: NotificationItem): string {
    switch (item.type) {
      case 'friend_request':
        return t('notifications.friendRequest');
      case 'friend_accepted':
        return t('notifications.friendAccepted');
      case 'invited':
        return t('notifications.invited');
      case 'your_turn':
        return t('notifications.yourTurn');
      case 'tournament_round_started':
        return t('notifications.tournamentRoundStarted');
      case 'tournament_eliminated':
        return t('notifications.tournamentEliminated');
    }
  }

  function handleSelect(n: NotificationItem) {
    if (!n.readAt) {
      markReadMutation.mutate({ id: n.id });
      markReadLocal(n.id);
    }
    if (n.type === 'friend_request' || n.type === 'friend_accepted') {
      setOpen(false);
      void navigate({ to: '/social/amigos' });
      return;
    }
    if ((n.type === 'invited' || n.type === 'your_turn') && n.payload && typeof n.payload === 'object' && 'code' in n.payload) {
      const code = (n.payload as { code: unknown }).code;
      if (typeof code === 'string') {
        setOpen(false);
        void navigate({ to: '/sala/$code', params: { code } });
      }
    }
    if (
      (n.type === 'tournament_round_started' || n.type === 'tournament_eliminated') &&
      n.payload &&
      typeof n.payload === 'object' &&
      'tournamentId' in n.payload
    ) {
      const tournamentId = (n.payload as { tournamentId: unknown }).tournamentId;
      if (typeof tournamentId === 'string') {
        setOpen(false);
        void navigate({ to: '/torneos/$id', params: { id: tournamentId } });
      }
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('notifications.aria')}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-tb-muted transition-colors hover:text-tb-accent"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-tb-danger px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div role="presentation" className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="tb-card absolute right-0 z-20 mt-2 w-80 rounded-xl border border-tb-border bg-tb-surface p-2 shadow-lg">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('notifications.title')}</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    markAllReadMutation.mutate();
                    markAllReadLocal();
                  }}
                  className="text-xs font-semibold text-tb-accent hover:text-tb-accent-strong"
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="px-2 py-3 text-sm text-tb-muted">{t('notifications.empty')}</p>
            ) : (
              <ul className="flex max-h-80 flex-col overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(n)}
                      className={`w-full rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-tb-surface-2 ${
                        n.readAt ? 'text-tb-muted' : 'font-semibold text-tb-text'
                      }`}
                    >
                      {describe(n)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
