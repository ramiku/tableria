import { useEffect } from 'react';
import { Link, Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { Avatar, type Presence } from '../components/Avatar';
import { FriendRow, type Friend } from '../components/FriendRow';
import { ChatDock } from '../components/ChatDock';
import { NotificationBell } from '../components/NotificationBell';
import { GridIcon, DoorIcon, UsersIcon, TrophyIcon, BarsIcon, GearIcon, LogoutIcon, ChatIcon } from '../components/icons';
import { fetchMe, logout } from '../lib/auth';
import { useFriendsList, type FriendWithPresence } from '../lib/friends';
import { trpc } from '../lib/trpc';
import { matchSocket } from '../lib/ws';
import { useChatDock } from '../stores/chatDock';

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const me = await fetchMe();
    if (!me) throw redirect({ to: '/login' });
    return { me };
  },
  component: AppLayout,
});

const navItems = [
  { to: '/', key: 'nav.explore', Icon: GridIcon },
  { to: '/salas', key: 'nav.rooms', Icon: DoorIcon },
  { to: '/amigos', key: 'nav.friends', Icon: UsersIcon },
  { to: '/mensajes', key: 'nav.messages', Icon: ChatIcon },
  { to: '/rankings', key: 'nav.rankings', Icon: BarsIcon },
  { to: '/torneos', key: 'nav.tournaments', Icon: TrophyIcon },
] as const;

function toFriendRow(f: FriendWithPresence, statusOnline: string, statusInGame: string): Friend {
  return {
    id: f.userId,
    name: f.displayName,
    initial: f.avatarInitial ?? f.username.charAt(0).toUpperCase(),
    color: f.avatarColor ?? '#2f6fe0',
    presence: (f.presence === 'in_game' ? 'online' : f.presence) as Presence,
    status: f.presence === 'in_game' ? statusInGame : f.presence === 'online' ? statusOnline : '',
  };
}

function AppLayout() {
  const { t } = useTranslation();
  const { me } = Route.useRouteContext();
  const navigate = useNavigate();
  const { friends } = useFriendsList();
  const { data: activity } = trpc.activity.listForMe.useQuery();
  const utils = trpc.useUtils();
  const openChat = useChatDock((s) => s.openChat);
  const getOrCreateDirect = trpc.conversations.getOrCreateDirect.useMutation({
    onSuccess: () => void utils.conversations.list.invalidate(),
  });

  useEffect(() => {
    matchSocket.connect();
  }, []);

  const onlineFriends = friends.filter((f) => f.presence !== 'offline');
  const friendsInGame = friends.filter((f) => f.presence === 'in_game');

  async function handleLogout() {
    await logout();
    await navigate({ to: '/login' });
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-tb-bg">
      {/* Sidebar: franja de marca fija (siempre oscura), full-height, full-bleed */}
      <aside className="flex w-[280px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-tb-sidebar-border bg-tb-sidebar-bg p-6">
        <Link to="/" className="mt-2">
          <Logo variant="stacked" />
        </Link>

        <nav aria-label={t('sidebar.aria.mainNav')} className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-tb-sidebar-muted transition-colors hover:text-tb-sidebar-text"
              activeProps={{ className: 'tb-nav-active' }}
              activeOptions={{ exact: item.to === '/' }}
            >
              <span className="tb-hex tb-nav-dot h-2 w-2 shrink-0 bg-tb-sidebar-border transition-colors" />
              <item.Icon className="shrink-0" />
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="tb-gradient-sidebar-cta w-full rounded-lg px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + {t('rail.createRoom')}
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="px-2 text-xs font-semibold uppercase tracking-wide text-tb-sidebar-muted">
            {t('rail.friendsOnline')} · {onlineFriends.length}
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {onlineFriends.length === 0 && <p className="px-2 py-2 text-xs text-tb-sidebar-muted">{t('rail.empty')}</p>}
            {onlineFriends.map((friend) => (
              <FriendRow
                key={friend.userId}
                friend={toFriendRow(friend, t('presence.online'), t('presence.inGame'))}
                onChat={() =>
                  getOrCreateDirect.mutate(
                    { friendId: friend.userId },
                    { onSuccess: ({ conversationId }) => openChat(conversationId, friend.displayName) },
                  )
                }
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-t border-tb-sidebar-border pt-4">
          <Avatar
            initial={me.avatarInitial ?? me.username.charAt(0).toUpperCase()}
            color={me.avatarColor ?? '#2f6fe0'}
            presence="online"
            tone="sidebar"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-tb-sidebar-text">{me.displayName}</p>
            <p className="text-xs text-tb-sidebar-success">{t('sidebar.status.online')}</p>
          </div>
          <Link
            to="/perfil"
            aria-label={t('sidebar.aria.profile')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-tb-sidebar-muted transition-colors hover:text-tb-sidebar-accent"
          >
            <GearIcon />
          </Link>
          <button
            type="button"
            aria-label={t('sidebar.aria.logout')}
            onClick={handleLogout}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-tb-sidebar-muted transition-colors hover:text-tb-sidebar-danger"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* Columna central: barra superior persistente + contenido de la página */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-end gap-2 border-b border-tb-border px-8 py-3">
          <NotificationBell />
          <ThemeToggle />
        </div>
        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Rail derecho: actividad + invitación (sigue el tema claro/oscuro) */}
      <aside className="hidden w-[300px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-tb-border bg-tb-surface-2 p-6 xl:flex">
        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-tb-muted">
            {t('rail.activity')}
          </h2>
          {!activity || activity.length === 0 ? (
            <p className="mt-2 text-sm text-tb-muted">{t('rail.empty')}</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-3">
              {activity.map((entry) => (
                <li key={entry.id} className="flex items-start gap-2.5">
                  <Avatar
                    initial={entry.actor.avatarInitial ?? entry.actor.username.charAt(0).toUpperCase()}
                    color={entry.actor.avatarColor ?? '#2f6fe0'}
                    size={28}
                  />
                  <p className="text-sm text-tb-text">
                    {t(`activityFeed.${entry.type}`, { name: entry.actor.displayName })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-tb-muted">
            {t('rail.friendsRooms')}
          </h2>
          {friendsInGame.length === 0 ? (
            <p className="mt-2 text-sm text-tb-muted">{t('rail.empty')}</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {friendsInGame.map((f) => (
                <li key={f.userId} className="flex items-center gap-2.5">
                  <Avatar initial={f.avatarInitial ?? f.username.charAt(0).toUpperCase()} color={f.avatarColor ?? '#2f6fe0'} size={28} />
                  <p className="text-sm text-tb-text">{f.displayName}</p>
                  <span className="text-xs text-tb-muted">{t('presence.inGame')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <ChatDock meId={me.id} />
    </div>
  );
}
