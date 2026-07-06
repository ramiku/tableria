import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_app/admin')({
  beforeLoad: ({ context }) => {
    if (!context.me.isAdmin) throw redirect({ to: '/' });
  },
  component: AdminLayout,
});

const tabs = [
  { to: '/admin/jugadores', key: 'admin.nav.players' },
  { to: '/admin/mesas', key: 'admin.nav.tables' },
  { to: '/admin/reportes', key: 'admin.nav.reports' },
  { to: '/admin/juegos', key: 'admin.nav.games' },
  { to: '/admin/mantenimiento', key: 'admin.nav.maintenance' },
  { to: '/admin/auditoria', key: 'admin.nav.auditLog' },
] as const;

function AdminLayout() {
  const { t } = useTranslation();
  return (
    <section>
      <h1 className="font-display text-2xl font-extrabold text-tb-text">{t('admin.title')}</h1>

      <nav className="mt-4 flex flex-wrap gap-1 border-b border-tb-border">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className="rounded-t-lg px-3 py-2 text-sm font-medium text-tb-muted transition-colors hover:text-tb-text"
            activeProps={{ className: 'border-b-2 border-tb-accent text-tb-accent' }}
          >
            {t(tab.key)}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        <Outlet />
      </div>
    </section>
  );
}
