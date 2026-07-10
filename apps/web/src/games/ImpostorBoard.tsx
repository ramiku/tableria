import { useTranslation } from 'react-i18next';
import type { ImpostorPlayerView } from '@tableria/games';
import { matchSocket } from '../lib/ws';
import type { BoardProps } from './BoardProps';
import { RoundEndModal } from './RoundEndModal';

export function ImpostorBoard({ matchId, mySeat, myTurn, view: rawView, players }: BoardProps) {
  const { t } = useTranslation();
  const view = rawView as ImpostorPlayerView | undefined;
  if (!view) return null;

  const isSpectator = mySeat === null;
  const seatLabel = (seat: number) =>
    seat === mySeat ? t('impostor.you') : (players.find((p) => p.seat === seat)?.username ?? t('impostor.seat', { n: seat + 1 }));

  function handleVote(target: number) {
    if (!myTurn) return;
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { type: 'vote', target } } });
  }

  function handleContinue() {
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { type: 'continue' } } });
  }

  const votedCount = view.votes.filter((v) => v !== null).length;
  const totalCast = votedCount; // cada voto emitido cuenta 1, aunque se haya cambiado después
  const voteCounts = Array.from({ length: view.numPlayers }, (_, seat) => view.votes.filter((v) => v === seat).length);
  const maxVotes = Math.max(0, ...voteCounts);
  // Clasificación en vivo, ordenada de más a menos votos — empates conservan el orden de asiento.
  const leaderboard = Array.from({ length: view.numPlayers }, (_, seat) => seat)
    .filter((seat) => seat !== mySeat)
    .sort((a, b) => voteCounts[b]! - voteCounts[a]!);
  const myVote = mySeat !== null ? view.votes[mySeat] : null;

  const showModal = view.phase === 'roundEnd' && view.lastRoundSummary !== null;
  const confirmed = mySeat !== null && !view.pendingConfirm.includes(mySeat);

  return (
    <div className="relative flex min-h-[30rem] flex-col items-center gap-5">
      <p className="tb-nums text-xs font-semibold uppercase tracking-wide text-tb-muted">
        {t('impostor.roundOf', { round: view.round + 1, total: view.totalRounds })}
      </p>

      <div
        className={`w-full max-w-sm rounded-2xl border-2 p-6 text-center ${
          isSpectator
            ? 'border-tb-border bg-tb-surface-2'
            : view.amITheImpostor
              ? 'border-tb-danger bg-tb-danger/10'
              : 'border-tb-accent bg-tb-accent-tint'
        }`}
      >
        {isSpectator ? (
          <p className="text-sm text-tb-muted">{t('impostor.spectatorHint')}</p>
        ) : view.amITheImpostor ? (
          <>
            <p className="font-display text-lg font-extrabold text-tb-danger">{t('impostor.youAreImpostor')}</p>
            <p className="mt-2 text-sm text-tb-muted">{t('impostor.impostorHint')}</p>
          </>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('impostor.secretWordLabel')}</p>
            <p className="font-display text-2xl font-extrabold text-tb-accent">{view.secretWord}</p>
          </>
        )}
      </div>

      {view.tied && view.phase === 'voting' && (
        <p className="rounded-lg bg-tb-warn-tint px-3 py-2 text-center text-xs font-medium text-tb-warn">{t('impostor.tieNote')}</p>
      )}

      {/* Se queda montada (inerte vía `myTurn`) incluso en `roundEnd` en vez de desmontarse — igual
          que el resto de tableros con el tablero de juego: si desapareciera, el contenedor se
          quedaría sin altura y el modal de resumen (`absolute inset-0`) no tendría dónde encajar. */}
      {!isSpectator && (
        <div className="w-full max-w-sm">
          {view.phase === 'voting' && (
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('impostor.leaderboardTitle')}</p>
          )}
          <div className="flex flex-col gap-1.5">
            {leaderboard.map((seat) => {
              const count = voteCounts[seat]!;
              const isLeader = count > 0 && count === maxVotes;
              const isMyVote = myVote === seat;
              return (
                <button
                  key={seat}
                  type="button"
                  onClick={() => handleVote(seat)}
                  disabled={!myTurn}
                  aria-pressed={isMyVote}
                  className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors disabled:cursor-default ${
                    isMyVote ? 'border-tb-accent ring-1 ring-tb-accent text-tb-accent' : 'border-tb-border text-tb-text hover:enabled:bg-tb-surface-2'
                  }`}
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 bg-tb-accent-tint transition-all"
                    style={{ width: totalCast > 0 ? `${(count / totalCast) * 100}%` : 0 }}
                  />
                  <span className="relative flex items-center justify-between gap-2">
                    <span className="truncate">
                      {seatLabel(seat)}
                      {isLeader && ' 🏆'}
                    </span>
                    <span className="tb-nums shrink-0">{count}</span>
                  </span>
                </button>
              );
            })}
          </div>
          {view.phase === 'voting' && (
            <p className="tb-nums mt-3 text-center text-xs text-tb-muted">
              {t('impostor.votesProgress', { voted: votedCount, total: view.numPlayers })}
            </p>
          )}
        </div>
      )}

      {showModal && (
        <RoundEndModal
          title={view.lastRoundSummary!.caught ? t('impostor.caughtTitle') : t('impostor.escapedTitle')}
          subtitle={t('impostor.revealSubtitle', {
            impostor: seatLabel(view.lastRoundSummary!.impostor),
            word: view.lastRoundSummary!.secretWord,
          })}
          rows={view.lastRoundSummary!.pointsAwarded.map((points, seat) => ({
            key: seat,
            label: seatLabel(seat),
            points,
            won: points > 0,
          }))}
          waitingFor={view.pendingConfirm.filter((s) => s !== mySeat).map((s) => seatLabel(s))}
          confirmed={confirmed}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
