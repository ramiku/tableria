import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/admin/mesas')({ component: TablesPage });

function TablesPage() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data } = trpc.admin.tables.listPending.useQuery(undefined, { refetchInterval: 10_000 });
  const cancel = trpc.admin.tables.cancel.useMutation({
    onSuccess: () => void utils.admin.tables.listPending.invalidate(),
  });

  if (!data || data.length === 0) {
    return <p className="text-sm text-tb-muted">{t('admin.tables.empty')}</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-tb-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-tb-surface-2 text-xs uppercase tracking-wide text-tb-muted">
          <tr>
            <th className="px-4 py-2 font-semibold">{t('admin.tables.code')}</th>
            <th className="px-4 py-2 font-semibold">{t('admin.tables.game')}</th>
            <th className="px-4 py-2 font-semibold">{t('admin.tables.players')}</th>
            <th className="px-4 py-2 font-semibold">{t('admin.tables.created')}</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-tb-border">
          {data.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-2 font-mono text-tb-text">{m.code}</td>
              <td className="px-4 py-2 text-tb-text">{m.gameId}</td>
              <td className="px-4 py-2 text-tb-muted">{m.maxPlayers}</td>
              <td className="px-4 py-2 text-tb-muted">{new Date(m.createdAt).toLocaleString()}</td>
              <td className="px-4 py-2 text-right">
                <button
                  type="button"
                  disabled={cancel.isPending}
                  onClick={() => {
                    if (confirm(t('admin.tables.cancelConfirm'))) cancel.mutate({ matchId: m.id });
                  }}
                  className="rounded-lg border border-tb-danger px-3 py-1.5 text-xs font-semibold text-tb-danger hover:bg-tb-danger/10 disabled:opacity-50"
                >
                  {t('admin.tables.cancel')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
