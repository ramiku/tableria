import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/admin/auditoria')({ component: AuditLogPage });

function AuditLogPage() {
  const { t } = useTranslation();
  const { data } = trpc.admin.auditLog.list.useQuery();

  if (!data || data.length === 0) {
    return <p className="text-sm text-tb-muted">{t('admin.auditLog.empty')}</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-tb-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-tb-surface-2 text-xs uppercase tracking-wide text-tb-muted">
          <tr>
            <th className="px-4 py-2 font-semibold">{t('admin.auditLog.admin')}</th>
            <th className="px-4 py-2 font-semibold">{t('admin.auditLog.action')}</th>
            <th className="px-4 py-2 font-semibold">{t('admin.auditLog.target')}</th>
            <th className="px-4 py-2 font-semibold">{t('admin.auditLog.date')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-tb-border">
          {data.map((entry) => (
            <tr key={entry.id}>
              <td className="px-4 py-2 text-tb-text">{entry.admin?.username ?? '—'}</td>
              <td className="px-4 py-2 font-mono text-xs text-tb-text">{entry.action}</td>
              <td className="px-4 py-2 text-tb-muted">
                {entry.targetType ? `${entry.targetType}:${entry.targetId}` : '—'}
              </td>
              <td className="px-4 py-2 text-tb-muted">{new Date(entry.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
