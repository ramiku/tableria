import { Link, createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/admin/juegos/')({ component: AdminGamesList });

function AdminGamesList() {
  const { t } = useTranslation();
  const { data } = trpc.admin.games.list.useQuery();

  if (!data) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-tb-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-tb-surface-2 text-xs uppercase tracking-wide text-tb-muted">
          <tr>
            <th className="px-4 py-2 font-semibold">{t('admin.games.name')}</th>
            <th className="px-4 py-2 font-semibold">{t('admin.games.category')}</th>
            <th className="px-4 py-2 font-semibold">{t('admin.games.players')}</th>
            <th className="px-4 py-2 font-semibold">{t('admin.games.active')}</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-tb-border">
          {data.map((g) => (
            <tr key={g.slug}>
              <td className="px-4 py-2 font-medium text-tb-text">{g.name}</td>
              <td className="px-4 py-2 text-tb-muted">{g.categoryName ?? '—'}</td>
              <td className="px-4 py-2 text-tb-muted">
                {g.minPlayers}–{g.maxPlayers}
              </td>
              <td className="px-4 py-2">
                {g.isActive ? (
                  <span className="rounded-full bg-tb-success/10 px-2 py-0.5 text-xs font-semibold text-tb-success">✓</span>
                ) : (
                  <span className="text-tb-muted">—</span>
                )}
              </td>
              <td className="px-4 py-2 text-right">
                <Link
                  to="/admin/juegos/$slug"
                  params={{ slug: g.slug }}
                  className="text-xs font-semibold text-tb-accent hover:underline"
                >
                  {t('admin.games.edit')}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
