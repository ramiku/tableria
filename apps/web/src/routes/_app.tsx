import { Link, Outlet, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { Avatar } from '../components/Avatar';
import { FriendRow, type Friend } from '../components/FriendRow';
import { InviteCard } from '../components/InviteCard';
import { GridIcon, DoorIcon, UsersIcon, TrophyIcon, BarsIcon, GearIcon, LogoutIcon } from '../components/icons';
import { fetchMe, logout } from '../lib/auth';

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
  { to: '/rankings', key: 'nav.rankings', Icon: BarsIcon },
  { to: '/torneos', key: 'nav.tournaments', Icon: TrophyIcon },
] as const;

// Datos de muestra hasta que M3 sirva amigos/presencia reales desde la API.
const demoFriends: Friend[] = [
  { id: '1', name: 'Lucía Tester', initial: 'L', color: '#2f6fe0', presence: 'online', status: '' },
  { id: '2', name: 'ramiku1', initial: 'R', color: '#1c5c52', presence: 'online', status: '' },
];

function AppLayout() {
  const { t } = useTranslation();
  const { me } = Route.useRouteContext();
  const navigate = useNavigate();

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
            {t('rail.friendsOnline')} · {demoFriends.length}
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            {demoFriends.map((friend) => (
              <FriendRow key={friend.id} friend={friend} />
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
        <div className="flex items-center justify-end border-b border-tb-border px-8 py-3">
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
          <p className="mt-2 text-sm text-tb-muted">{t('rail.empty')}</p>
        </div>

        <div>
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-tb-muted">
            {t('rail.friendsRooms')}
          </h2>
          <p className="mt-2 text-sm text-tb-muted">{t('rail.empty')}</p>
        </div>

        <div className="mt-auto">
          <InviteCard />
        </div>
      </aside>
    </div>
  );
}
