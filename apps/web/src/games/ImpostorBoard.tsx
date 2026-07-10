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

  const votedCount = view.submitted.filter(Boolean).length;
  const showModal = view.phase === 'roundEnd' && view.lastRoundSummary !== null;
  const confirmed = mySeat !== null && !view.pendingConfirm.includes(mySeat);

  return (
    <div className="relative flex flex-col items-center gap-5">
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

      {view.revoteCount > 0 && view.phase === 'voting' && (
        <p className="rounded-lg bg-tb-warn-tint px-3 py-2 text-center text-xs font-medium text-tb-warn">{t('impostor.tieNote')}</p>
      )}

      {/* Se queda montada (inerte vía `myTurn`) incluso en `roundEnd` en vez de desmontarse — igual
          que el resto de tableros con el tablero de juego: si desapareciera, el contenedor se
          quedaría sin altura y el modal de resumen (`absolute inset-0`) no tendría dónde encajar. */}
      {!isSpectator && (
        <div className="w-full max-w-sm">
          {view.phase === 'voting' && (
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-tb-muted">
              {myTurn ? t('impostor.chooseVote') : t('impostor.voteCast')}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: view.numPlayers }, (_, seat) => seat)
              .filter((seat) => seat !== mySeat)
              .map((seat) => (
                <button
                  key={seat}
                  type="button"
                  onClick={() => handleVote(seat)}
                  disabled={!myTurn}
                  aria-pressed={view.myVote === seat}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-default ${
                    view.myVote === seat
                      ? 'border-tb-accent bg-tb-accent-tint text-tb-accent'
                      : 'border-tb-border text-tb-text hover:enabled:bg-tb-surface-2 disabled:opacity-50'
                  }`}
                >
                  {seatLabel(seat)}
                </button>
              ))}
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
