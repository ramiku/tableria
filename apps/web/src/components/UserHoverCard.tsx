import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMemberSince } from '../lib/formatDate';
import { trpc } from '../lib/trpc';
import { useLocaleStore } from '../stores/i18n';

const HOVER_DELAY_MS = 300;

const REPORT_REASONS = ['unsportsmanlike', 'abusive_language', 'cheating', 'other'] as const;
type ReportReason = (typeof REPORT_REASONS)[number];

/** Verde/ámbar/rojo según tramo — la misma lectura rápida que un semáforo. */
function reputationTextTone(reputation: number): string {
  if (reputation >= 70) return 'text-tb-success';
  if (reputation >= 40) return 'text-tb-warn';
  return 'text-tb-danger';
}
function reputationBarTone(reputation: number): string {
  if (reputation >= 70) return 'bg-tb-success';
  if (reputation >= 40) return 'bg-tb-warn';
  return 'bg-tb-danger';
}

/**
 * Envuelve el avatar de cualquier jugador (amigos, asientos de mesa, jugadores de una
 * partida, rankings…): al pasar el ratón, tras un pequeño delay, muestra nick, fecha de
 * alta, reputación y estadísticas — la query solo se dispara la primera vez que hace
 * falta (`enabled: open`), no en cada render de una lista larga.
 *
 * `matchId` es opcional: solo lo pasa la pantalla de partida (para un rival, nunca para
 * uno mismo) y habilita ahí el botón de reportar, disponible durante la partida y no solo
 * al terminarla — antes solo existía en la pantalla de resultado final.
 */
export function UserHoverCard({ userId, matchId, children }: { userId: string; matchId?: string; children: ReactNode }) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>('unsportsmanlike');
  const [comment, setComment] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data } = trpc.users.publicProfile.useQuery({ userId }, { enabled: open, staleTime: 5 * 60_000 });
  const report = trpc.moderation.report.useMutation();

  function handleEnter() {
    timerRef.current = setTimeout(() => setOpen(true), HOVER_DELAY_MS);
  }
  function handleLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
    setReportOpen(false);
  }

  const winRate = data && data.totalPlayed > 0 ? Math.round((data.totalWins / data.totalPlayed) * 100) : 0;

  return (
    <span className="relative inline-flex" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {open && (
        <div className="tb-modal-in absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-tb-border bg-tb-surface p-4 text-left shadow-lg">
          {!data ? (
            <div className="h-24 animate-pulse rounded-lg bg-tb-surface-2" />
          ) : (
            <>
              <p className="truncate font-display text-sm font-bold text-tb-text">{data.displayName}</p>
              <p className="truncate text-xs text-tb-muted">@{data.username}</p>
              <p className="mt-1.5 text-xs text-tb-muted">
                {t('userCard.memberSince', { date: formatMemberSince(new Date(data.createdAt), locale) })}
              </p>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-tb-muted">{t('userCard.reputation')}</span>
                  <span className={reputationTextTone(data.reputation)}>{data.reputation}/100</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-tb-surface-2">
                  <div
                    className={`h-full rounded-full transition-all ${reputationBarTone(data.reputation)}`}
                    style={{ width: `${data.reputation}%` }}
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-tb-muted">
                {t('userCard.stats', { played: data.totalPlayed, winRate })}
              </p>

              {matchId &&
                (report.isSuccess ? (
                  <p className="mt-3 text-xs font-medium text-tb-success">{t('partida.reportSent')}</p>
                ) : !reportOpen ? (
                  <button
                    type="button"
                    onClick={() => setReportOpen(true)}
                    className="mt-3 text-xs font-semibold text-tb-muted transition-colors hover:text-tb-danger"
                  >
                    {t('partida.report', { name: data.displayName })}
                  </button>
                ) : (
                  <div className="mt-3 rounded-xl border border-tb-border bg-tb-surface-2 p-3 text-left">
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value as ReportReason)}
                      className="w-full rounded-lg border border-tb-border bg-tb-surface px-2 py-1.5 text-xs text-tb-text"
                    >
                      {REPORT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {t(`partida.reportReason.${r}`)}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('partida.reportCommentPlaceholder')}
                      rows={2}
                      className="mt-2 w-full resize-none rounded-lg border border-tb-border bg-tb-surface px-2 py-1.5 text-xs text-tb-text placeholder:text-tb-muted"
                    />
                    {report.isError && <p className="mt-1 text-xs font-medium text-tb-danger">{report.error.message}</p>}
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setReportOpen(false)}
                        className="text-xs text-tb-muted hover:text-tb-text"
                      >
                        {t('partida.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          report.mutate({ matchId, reportedUserId: userId, reason, comment: comment.trim() || undefined })
                        }
                        disabled={report.isPending}
                        className="rounded-lg bg-tb-danger px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {t('partida.reportSubmit')}
                      </button>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      )}
    </span>
  );
}
