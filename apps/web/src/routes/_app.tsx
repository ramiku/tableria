import { useEffect, useState } from 'react';
import { Link, Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { Avatar, type Presence } from '../components/Avatar';
import { FriendRow, type Friend } from '../components/FriendRow';
import { ChatDock } from '../components/ChatDock';
import { VoiceCallWidget } from '../components/VoiceCallWidget';
import { NotificationBell } from '../components/NotificationBell';
import { GridIcon, DoorIcon, TrophyIcon, BarsIcon, GearIcon, LogoutIcon, ChatIcon, ShieldIcon, MenuIcon, CloseIcon } from '../components/icons';
import { MaintenancePage } from '../components/MaintenancePage';
import { fetchMaintenanceStatus, fetchMe, logout } from '../lib/auth';
import { useFriendsList, type FriendWithPresence } from '../lib/friends';
import { trpc } from '../lib/trpc';
import { matchSocket } from '../lib/ws';
import { useChatDock } from '../stores/chatDock';

export const Route = createFileRoute('/_app')({
  beforeLoad: async () => {
    const me = await fetchMe();
    if (!me) throw redirect({ to: '/login' });
    const maintenance = me.isAdmin ? { enabled: false, maintenanceMessage: null } : await fetchMaintenanceStatus();
    return { me, maintenance };
  },
  component: AppLayout,
});

const navItems = [
  { to: '/', key: 'nav.explore', Icon: GridIcon },
  { to: '/salas', key: 'nav.rooms', Icon: DoorIcon },
  { to: '/social', key: 'nav.social', Icon: ChatIcon },
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
  const { me, maintenance } = Route.useRouteContext();
  const navigate = useNavigate();
  // En <lg la sidebar vive como drawer off-canvas; este estado solo existe ahí
  // (en escritorio la sidebar es estática y el estado simplemente no se usa).
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { friends } = useFriendsList();
  const { data: activity } = trpc.activity.listForMe.useQuery();
  const { data: friendsRooms } = trpc.matches.friendsWaiting.useQuery(undefined, { refetchInterval: 5000 });
  const { data: pendingFriendRequests } = trpc.friends.listPending.useQuery();
  const { data: conversationsList } = trpc.conversations.list.useQuery();
  const utils = trpc.useUtils();
  const openChat = useChatDock((s) => s.openChat);
  const getOrCreateDirect = trpc.conversations.getOrCreateDirect.useMutation({
    onSuccess: () => void utils.conversations.list.invalidate(),
  });
  const joinFriendRoom = trpc.matches.join.useMutation({
    onSuccess: (_result, variables) => {
      void utils.matches.myActive.invalidate();
      void navigate({ to: '/sala/$code', params: { code: variables.code } });
    },
  });

  useEffect(() => {
    matchSocket.connect();
  }, []);

  // Escape cierra el drawer móvil (ruta de escape estándar, igual que el scrim).
  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  const onlineFriends = friends.filter((f) => f.presence !== 'offline');
  const socialBadgeCount =
    (pendingFriendRequests?.incoming.length ?? 0) + (conversationsList?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0);

  async function handleLogout() {
    await logout();
    await navigate({ to: '/login' });
  }

  if (maintenance.enabled) return <MaintenancePage message={maintenance.maintenanceMessage} />;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-tb-bg">
      {/* Scrim del drawer móvil */}
      {drawerOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar: franja de marca fija (siempre oscura). En escritorio es una columna
          estática; en <lg se convierte en drawer off-canvas (mismo contenido). */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] shrink-0 -translate-x-full flex-col gap-6 overflow-y-auto border-r border-tb-sidebar-border bg-tb-sidebar-bg p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] transition-transform duration-200 ease-out motion-reduce:transition-none lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:pb-6 ${
          drawerOpen ? 'translate-x-0' : ''
        }`}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label={t('shell.closeMenu')}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-tb-sidebar-muted transition-colors hover:text-tb-sidebar-text lg:hidden"
        >
          <CloseIcon />
        </button>
        <Link to="/" className="mt-2" onClick={() => setDrawerOpen(false)}>
          <Logo variant="stacked" />
        </Link>

        <nav aria-label={t('sidebar.aria.mainNav')} className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-tb-sidebar-muted transition-colors hover:text-tb-sidebar-text"
              activeProps={{ className: 'tb-nav-active' }}
              activeOptions={{ exact: item.to === '/' }}
            >
              <span className="tb-hex tb-nav-dot h-2 w-2 shrink-0 bg-tb-sidebar-border transition-colors" />
              <item.Icon className="shrink-0" />
              {t(item.key)}
              {item.to === '/social' && socialBadgeCount > 0 && (
                <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-tb-danger px-1 text-[10px] font-bold text-white">
                  {socialBadgeCount}
                </span>
              )}
            </Link>
          ))}
          {me.isAdmin && (
            <Link
              to="/admin"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-tb-sidebar-muted transition-colors hover:text-tb-sidebar-text"
              activeProps={{ className: 'tb-nav-active' }}
            >
              <span className="tb-hex tb-nav-dot h-2 w-2 shrink-0 bg-tb-sidebar-border transition-colors" />
              <ShieldIcon className="shrink-0" />
              {t('nav.admin')}
            </Link>
          )}
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
                    {
                      onSuccess: ({ conversationId }) => {
                        openChat(conversationId, friend.displayName);
                        setDrawerOpen(false);
                      },
                    },
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
            onClick={() => setDrawerOpen(false)}
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
        <div className="flex h-14 items-center gap-1 border-b border-tb-border px-3 sm:px-4 lg:justify-end lg:gap-2 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('shell.openMenu')}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-tb-muted transition-colors hover:bg-tb-surface-2 hover:text-tb-text lg:hidden"
          >
            <MenuIcon />
          </button>
          <Link to="/" className="mr-auto flex items-center lg:hidden">
            <Logo variant="inline" size={26} />
          </Link>
          <NotificationBell />
          <ThemeToggle />
        </div>
        <main className="flex-1 overflow-y-auto px-4 py-5 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
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
          {!friendsRooms || friendsRooms.length === 0 ? (
            <p className="mt-2 text-sm text-tb-muted">{t('rail.empty')}</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {friendsRooms.map((room) => (
                <li key={room.matchId} className="group flex items-center gap-2.5 rounded-lg px-1 py-1.5 -mx-1 transition-colors hover:bg-tb-surface">
                  <Avatar
                    initial={room.hostAvatarInitial ?? room.hostDisplayName.charAt(0).toUpperCase()}
                    color={room.hostAvatarColor ?? '#2f6fe0'}
                    size={28}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-tb-text">{room.hostDisplayName}</p>
                    <p className="truncate text-xs text-tb-muted">{room.gameName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => joinFriendRoom.mutate({ code: room.code })}
                    disabled={joinFriendRoom.isPending}
                    className="shrink-0 rounded-lg border border-tb-border px-2.5 py-1 text-xs font-semibold text-tb-accent opacity-0 transition-opacity hover:border-tb-accent hover:bg-tb-accent-tint group-hover:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
                  >
                    {t('lobby.join')}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {joinFriendRoom.isError && <p className="mt-1.5 text-xs font-medium text-tb-danger">{joinFriendRoom.error.message}</p>}
        </div>
      </aside>

      {/* Bottom nav móvil: los 5 destinos principales, sobre la franja de marca oscura
          (misma identidad que la sidebar). El resto (admin, perfil, amigos…) vive en el drawer. */}
      <nav
        aria-label={t('sidebar.aria.mainNav')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-tb-sidebar-border bg-tb-sidebar-bg pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="flex h-14 items-stretch">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-tb-sidebar-muted transition-colors"
              activeProps={{ className: 'tb-bottomnav-active' }}
              activeOptions={{ exact: item.to === '/' }}
            >
              <span className="relative">
                <item.Icon className="h-5 w-5" />
                {item.to === '/social' && socialBadgeCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-tb-danger px-1 text-[10px] font-bold text-white">
                    {socialBadgeCount}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate px-1">{t(item.key)}</span>
            </Link>
          ))}
        </div>
      </nav>

      <ChatDock meId={me.id} />
      <VoiceCallWidget />
    </div>
  );
}
