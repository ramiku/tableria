import { Link, Outlet, createRootRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createRootRoute({ component: RootLayout });

const navItems = [
  { to: '/', key: 'nav.explore' },
  { to: '/salas', key: 'nav.rooms' },
  { to: '/amigos', key: 'nav.friends' },
  { to: '/rankings', key: 'nav.rankings' },
  { to: '/torneos', key: 'nav.tournaments' },
] as const;

function RootLayout() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto grid min-h-dvh max-w-[1400px] grid-cols-[220px_1fr] gap-4 p-4 xl:grid-cols-[220px_1fr_280px]">
      {/* Rail izquierdo: marca + navegación */}
      <aside className="flex flex-col gap-6 rounded-2xl border border-tb-border bg-tb-surface p-4">
        <Link to="/" className="font-display text-xl font-extrabold tracking-tight">
          <span className="text-tb-accent">●</span> {t('app.name')}
        </Link>
        <nav aria-label={t('app.name')} className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-tb-muted transition-colors hover:bg-tb-surface-2 hover:text-tb-text"
              activeProps={{ className: 'bg-tb-surface-2 !text-tb-text' }}
              activeOptions={{ exact: item.to === '/' }}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-xs text-tb-muted">{t('app.tagline')}</div>
      </aside>

      {/* Panel central: la vista activa */}
      <main className="min-w-0 rounded-2xl border border-tb-border bg-tb-surface p-6">
        <Outlet />
      </main>

      {/* Rail derecho: actividad (placeholder hasta M3) */}
      <aside className="hidden flex-col gap-4 rounded-2xl border border-tb-border bg-tb-surface p-4 xl:flex">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-tb-muted">
          {t('rail.activity')}
        </h2>
        <p className="text-sm text-tb-muted">{t('rail.empty')}</p>
      </aside>
    </div>
  );
}
