import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tuteGroupOf, type TutePlayerView, type TuteSuit } from '@tableria/games';
import { SpanishCard } from '../components/SpanishCard';
import { matchSocket } from '../lib/ws';
import type { BoardProps } from './BoardProps';
import { RoundEndModal } from './RoundEndModal';

const SUIT_LABEL: Record<string, string> = { oros: 'Oros', copas: 'Copas', espadas: 'Espadas', bastos: 'Bastos' };
const RANK_LABEL: Record<number, string> = { 1: 'As', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
const CARD_WIDTH = 'w-16 sm:w-20';
const SUITS: TuteSuit[] = ['oros', 'copas', 'espadas', 'bastos'];

function cardLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank);
}

/** Compartido por Tute (4, por parejas) y Tute Cabrón (3, cada uno a la suya) — la única
 * diferencia real ya vive en el motor (`tuteGroupOf`); aquí solo cambia cómo se etiquetan los
 * marcadores según haya parejas o no. */
export function TuteBoard({ matchId, seq, mySeat, myTurn, view: rawView, players }: BoardProps) {
  const { t } = useTranslation();
  const view = rawView as TutePlayerView | undefined;
  const [armedCante, setArmedCante] = useState<TuteSuit | null>(null);

  useEffect(() => {
    setArmedCante(null);
  }, [seq]);

  if (!view) return null;

  const isTeams = view.numPlayers === 4;
  const isLeading = view.currentTrick.every((c) => c === null);
  const myGroup = mySeat !== null ? tuteGroupOf(mySeat, view.numPlayers) : null;

  function handlePlay(cardIndex: number) {
    if (!myTurn) return;
    matchSocket.send({
      type: 'match.move',
      payload: { matchId, move: armedCante ? { type: 'play', cardIndex, cante: armedCante } : { type: 'play', cardIndex } },
    });
    setArmedCante(null);
  }

  function handleContinue() {
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { type: 'continue' } } });
  }

  function toggleCante(suit: TuteSuit) {
    setArmedCante((prev) => (prev === suit ? null : suit));
  }

  const cantableSuits =
    myTurn && isLeading && view.hand
      ? SUITS.filter(
          (suit) =>
            !view.cantedSuits.includes(suit) &&
            view.hand!.some((c) => c.suit === suit && c.rank === 12) &&
            view.hand!.some((c) => c.suit === suit && c.rank === 11),
        )
      : [];

  const seatName = (seat: number) =>
    seat === mySeat ? t('tute.you') : (players.find((p) => p.seat === seat)?.username ?? t('tute.seat', { n: seat + 1 }));

  const groupLabel = (group: number) =>
    isTeams ? (group === myGroup ? t('tute.yourTeam') : t('tute.rivalTeam')) : seatName(group);

  const showModal = view.phase === 'roundEnd' && view.lastRoundSummary !== null;
  const confirmed = mySeat !== null && !view.pendingConfirm.includes(mySeat);

  return (
    <div className="relative flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">
          {t('tute.trump')}: <span className="text-tb-text">{SUIT_LABEL[view.trumpSuit]}</span>
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">
          {t('roundEnd.roundOf', { round: view.roundNumber, roundsToWin: view.roundsToWin })}
        </p>
        <div className="flex flex-wrap gap-2">
          {view.groupScores.map((score, group) => (
            <span
              key={group}
              className={`tb-nums rounded-full px-2.5 py-1 text-xs font-bold ${
                group === myGroup ? 'bg-tb-accent-tint text-tb-accent' : 'bg-tb-surface-2 text-tb-muted'
              }`}
            >
              {groupLabel(group)}: {score} · {t('roundEnd.roundsWon', { n: view.matchRoundsWon[group] })}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {view.currentTrick.map((c, seat) => (c ? <SpanishCard key={seat} suit={c.suit} rank={c.rank} className={CARD_WIDTH} /> : <SpanishCard key={seat} back className={CARD_WIDTH} />))}
      </div>

      {cantableSuits.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {cantableSuits.map((suit) => (
            <button
              key={suit}
              type="button"
              onClick={() => toggleCante(suit)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                armedCante === suit
                  ? 'border-tb-accent bg-tb-accent-tint text-tb-accent'
                  : 'border-tb-border text-tb-text hover:bg-tb-surface-2'
              }`}
            >
              {t('tute.cante', { suit: SUIT_LABEL[suit], points: suit === view.trumpSuit ? 40 : 20 })}
            </button>
          ))}
        </div>
      )}

      {view.hand && (
        <div className="flex flex-wrap justify-center gap-3">
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
          title={t('tute.roundSummary.title')}
          subtitle={t('brisca.roundOf', { round: view.roundNumber, roundsToWin: view.roundsToWin })}
          tie={view.lastRoundSummary!.winnerGroups.length === 0}
          rows={view.lastRoundSummary!.groupPoints.map((points, group) => ({
            key: group,
            label: groupLabel(group),
            points,
            won: view.lastRoundSummary!.winnerGroups.includes(group),
          }))}
          waitingFor={view.pendingConfirm.filter((s) => s !== mySeat).map((s) => seatName(s))}
          confirmed={confirmed}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
