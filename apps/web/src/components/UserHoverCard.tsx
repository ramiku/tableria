import { useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMemberSince } from '../lib/formatDate';
import { trpc } from '../lib/trpc';
import { useLocaleStore } from '../stores/i18n';

const HOVER_DELAY_MS = 300;

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
 */
export function UserHoverCard({ userId, children }: { userId: string; children: ReactNode }) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data } = trpc.users.publicProfile.useQuery({ userId }, { enabled: open, staleTime: 5 * 60_000 });

  function handleEnter() {
    timerRef.current = setTimeout(() => setOpen(true), HOVER_DELAY_MS);
  }
  function handleLeave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
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
            </>
          )}
        </div>
      )}
    </span>
  );
}
