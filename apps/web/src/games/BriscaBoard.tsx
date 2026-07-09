import { useTranslation } from 'react-i18next';
import type { BriscaPlayerView } from '@tableria/games';
import { SpanishCard } from '../components/SpanishCard';
import { matchSocket } from '../lib/ws';
import type { BoardProps } from './BoardProps';
import { RoundEndModal } from './RoundEndModal';

const SUIT_LABEL: Record<string, string> = { oros: 'Oros', copas: 'Copas', espadas: 'Espadas', bastos: 'Bastos' };
const RANK_LABEL: Record<number, string> = { 1: 'As', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
const CARD_WIDTH = 'w-24 sm:w-32 lg:w-40';

function cardLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank);
}

export function BriscaBoard({ matchId, mySeat, myTurn, view: rawView, players }: BoardProps) {
  const { t } = useTranslation();
  const view = rawView as BriscaPlayerView | undefined;
  if (!view) return null;

  function handlePlay(cardIndex: number) {
    if (!myTurn) return;
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { type: 'play', cardIndex } } });
  }

  function handleContinue() {
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { type: 'continue' } } });
  }

  const seatLabel = (seat: number) =>
    seat === mySeat ? t('brisca.you') : (players.find((p) => p.seat === seat)?.username ?? t('brisca.seat', { n: seat + 1 }));
  const showModal = view.phase === 'roundEnd' && view.lastRoundSummary !== null;
  const confirmed = mySeat !== null && !view.pendingConfirm.includes(mySeat);

  return (
    <div className="relative flex flex-col items-center gap-8">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('brisca.trump')}</span>
          <SpanishCard suit={view.trumpCard.suit} rank={view.trumpCard.rank} className={CARD_WIDTH} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">
          {t('brisca.deck')}: <span className="tb-nums text-tb-text">{view.deckCount}</span>
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">
          {t('roundEnd.roundOf', { round: view.roundNumber, roundsToWin: view.roundsToWin })}
        </p>
        <div className="flex flex-wrap gap-2">
          {view.points.map((p, seat) => (
            <span
              key={seat}
              className={`tb-nums rounded-full px-2.5 py-1 text-xs font-bold ${
                seat === mySeat ? 'bg-tb-accent-tint text-tb-accent' : 'bg-tb-surface-2 text-tb-muted'
              }`}
            >
              {seatLabel(seat)}: {p} · {t('roundEnd.roundsWon', { n: view.matchPoints[seat] })}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-4 sm:gap-6">
        {view.currentTrick.map((c, seat) =>
          c ? (
            <SpanishCard key={seat} suit={c.suit} rank={c.rank} className={CARD_WIDTH} />
          ) : (
            <SpanishCard key={seat} back className={CARD_WIDTH} />
          ),
        )}
      </div>

      {view.hand && (
        <div className="flex gap-4 sm:gap-6">
          {view.hand.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePlay(i)}
              disabled={!myTurn}
              aria-label={`${cardLabel(c.rank)} de ${SUIT_LABEL[c.suit]}`}
              className="transition-transform enabled:hover:-translate-y-1 disabled:cursor-default disabled:opacity-70"
            >
              <SpanishCard suit={c.suit} rank={c.rank} className={CARD_WIDTH} />
            </button>
          ))}
        </div>
      )}

      {showModal && (
        <RoundEndModal
          title={t('brisca.roundSummary.title')}
          subtitle={t('roundEnd.roundOf', { round: view.roundNumber, roundsToWin: view.roundsToWin })}
          tie={view.lastRoundSummary!.winnerSeats.length === 0}
          rows={view.lastRoundSummary!.roundPoints.map((points, seat) => ({
            key: seat,
            label: seatLabel(seat),
            points,
            won: view.lastRoundSummary!.winnerSeats.includes(seat),
          }))}
          waitingFor={view.pendingConfirm.filter((s) => s !== mySeat).map((s) => seatLabel(s))}
          confirmed={confirmed}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
