import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { MatchChatModal } from '../components/admin/ChatModals';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/admin/reportes')({ component: ReportsPage });

function ReportsPage() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data } = trpc.admin.reports.list.useQuery();
  const markReviewed = trpc.admin.reports.markReviewed.useMutation({
    onSuccess: () => void utils.admin.reports.list.invalidate(),
  });
  const [chatMatchId, setChatMatchId] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return <p className="text-sm text-tb-muted">{t('admin.reports.empty')}</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {data.map((r) => (
          <div key={r.id} className="rounded-xl border border-tb-border bg-tb-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-tb-text">
                <span className="font-semibold">{r.reporter?.username ?? '—'}</span>
                {' → '}
                <span className="font-semibold">{r.reportedUser?.username ?? '—'}</span>
                {' · '}
                {t(`partida.reportReason.${r.reason}`)}
              </p>
              {r.reviewedAt && (
                <span className="rounded-full bg-tb-surface-2 px-2 py-0.5 text-xs font-semibold text-tb-muted">
                  {t('admin.reports.reviewed')}
                </span>
              )}
            </div>
            {r.comment && <p className="mt-1.5 text-sm text-tb-muted">{r.comment}</p>}
            <p className="mt-1 text-xs text-tb-muted">{new Date(r.createdAt).toLocaleString()}</p>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setChatMatchId(r.matchId)}
                className="rounded-lg border border-tb-border px-3 py-1.5 text-xs font-semibold text-tb-text hover:bg-tb-surface-2"
              >
                {t('admin.reports.viewChat')}
              </button>
              {!r.reviewedAt && (
                <button
                  type="button"
                  disabled={markReviewed.isPending}
                  onClick={() => markReviewed.mutate({ reportId: r.id })}
                  className="rounded-lg bg-tb-accent px-3 py-1.5 text-xs font-semibold text-tb-accent-fg disabled:opacity-50"
                >
                  {t('admin.reports.markReviewed')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {chatMatchId && <MatchChatModal matchId={chatMatchId} onClose={() => setChatMatchId(null)} />}
    </>
  );
}
