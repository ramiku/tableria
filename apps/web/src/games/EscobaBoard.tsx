import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EscobaPlayerView } from '@tableria/games';
import { SpanishCard } from '../components/SpanishCard';
import { matchSocket } from '../lib/ws';
import type { BoardProps } from './BoardProps';
import { RoundEndModal } from './RoundEndModal';

const SUIT_LABEL: Record<string, string> = { oros: 'Oros', copas: 'Copas', espadas: 'Espadas', bastos: 'Bastos' };
const RANK_LABEL: Record<number, string> = { 1: 'As', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
const CARD_WIDTH = 'w-16 sm:w-20';

/** Valor de cada carta a efectos de sumar 15 — igual que en `packages/games/src/escoba/logic.ts`
 * (duplicado a propósito: el frontend no importa lógica de motor, solo tipos). */
const CAPTURE_VALUE: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 10: 8, 11: 9, 12: 10 };

function cardLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank);
}

export function EscobaBoard({ matchId, seq, mySeat, myTurn, view: rawView, players }: BoardProps) {
  const { t } = useTranslation();
  const view = rawView as EscobaPlayerView | undefined;
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<Set<number>>(new Set());
  const [seenSeq, setSeenSeq] = useState(seq);

  // Un movimiento real (propio o ajeno) cierra cualquier selección en curso — se resetea AQUÍ,
  // durante el render, en vez de en un useEffect: `view.table`/`view.hand` ya han cambiado de
  // tamaño en cuanto llega el nuevo `seq`, y un efecto solo corre DESPUÉS de pintar, así que
  // habría un render intermedio con índices de la selección anterior apuntando a cartas que ya
  // no existen (`view.table[i]` → undefined → el crash real que se reportó: "Cannot read
  // properties of undefined (reading 'rank')" al calcular la suma con una captura ya resuelta).
  if (seq !== seenSeq) {
    setSeenSeq(seq);
    setSelectedCard(null);
    setSelectedTable(new Set());
  }

  if (!view) return null;

  function toggleTable(index: number) {
    if (selectedCard === null) return;
    setSelectedTable((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleSelectCard(index: number) {
    if (!myTurn) return;
    if (selectedCard === index) {
      setSelectedCard(null);
      setSelectedTable(new Set());
      return;
    }
    setSelectedCard(index);
    setSelectedTable(new Set());
  }

  function handlePlay() {
    if (selectedCard === null) return;
    matchSocket.send({
      type: 'match.move',
      payload: { matchId, move: { type: 'play', cardIndex: selectedCard, captureIndices: Array.from(selectedTable) } },
    });
  }

  function handleContinue() {
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { type: 'continue' } } });
  }

  const seatLabel = (seat: number) =>
    seat === mySeat ? t('escoba.you') : (players.find((p) => p.seat === seat)?.username ?? t('escoba.seat', { n: seat + 1 }));

  // `?.` de más: aunque el reset de arriba ya cubre el caso real, un `Set`/índice que apunte
  // fuera de la mano o la mesa actuales no debería nunca poder tirar el render entero.
  const sum =
    (selectedCard !== null ? (CAPTURE_VALUE[view.hand?.[selectedCard]?.rank ?? -1] ?? 0) : 0) +
    Array.from(selectedTable).reduce((acc, i) => acc + (CAPTURE_VALUE[view.table[i]?.rank ?? -1] ?? 0), 0);

  const showModal = view.phase === 'roundEnd' && view.lastHandSummary !== null;
  const confirmed = mySeat !== null && !view.pendingConfirm.includes(mySeat);

  return (
    <div className="relative flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">
          {t('escoba.deck')}: <span className="tb-nums text-tb-text">{view.deckCount}</span>
        </p>
        <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">
          {t('escoba.target', { n: view.targetScore })}
        </p>
        <div className="flex flex-wrap gap-2">
          {view.scores.map((score, seat) => (
            <span
              key={seat}
              className={`tb-nums rounded-full px-2.5 py-1 text-xs font-bold ${
                seat === mySeat ? 'bg-tb-accent-tint text-tb-accent' : 'bg-tb-surface-2 text-tb-muted'
              }`}
            >
              {seatLabel(seat)}: {score}
              {view.escobas[seat]! > 0 ? ` (🧹${view.escobas[seat]})` : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('escoba.table')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {view.table.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleTable(i)}
              disabled={selectedCard === null}
              aria-label={`${cardLabel(c.rank)} de ${SUIT_LABEL[c.suit]}`}
              aria-pressed={selectedTable.has(i)}
              className={`rounded-lg transition-transform disabled:cursor-default ${
                selectedTable.has(i) ? '-translate-y-2 ring-2 ring-tb-accent' : ''
              } ${selectedCard !== null ? 'enabled:hover:-translate-y-1' : ''}`}
            >
              <SpanishCard suit={c.suit} rank={c.rank} className={CARD_WIDTH} />
            </button>
          ))}
          {view.table.length === 0 && <p className="text-xs text-tb-muted">{t('escoba.tableEmpty')}</p>}
        </div>
      </div>

      {view.hand && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-3">
            {view.hand.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectCard(i)}
                disabled={!myTurn}
                aria-label={`${cardLabel(c.rank)} de ${SUIT_LABEL[c.suit]}`}
                aria-pressed={selectedCard === i}
                className={`rounded-lg transition-transform disabled:cursor-default disabled:opacity-70 ${
                  selectedCard === i ? '-translate-y-2 ring-2 ring-tb-accent' : 'enabled:hover:-translate-y-1'
                }`}
              >
                <SpanishCard suit={c.suit} rank={c.rank} className={CARD_WIDTH} />
              </button>
            ))}
          </div>

          {myTurn && selectedCard !== null && (
            <div className="flex items-center gap-3">
              <span className={`tb-nums text-sm font-semibold ${sum === 15 ? 'text-tb-success' : 'text-tb-muted'}`}>
                {t('escoba.sum', { sum })}
              </span>
              <button
                type="button"
                onClick={handlePlay}
                className="tb-gradient-cta rounded-lg px-4 py-1.5 text-sm font-bold text-white"
              >
                {t('escoba.play')}
              </button>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <RoundEndModal
          title={t('escoba.handSummary.title')}
          subtitle={t('escoba.target', { n: view.targetScore })}
          rows={view.lastHandSummary!.handPoints.map((points, seat) => ({
            key: seat,
            label: seatLabel(seat),
            points,
            won: points > 0,
          }))}
          footer={
            <ul className="w-full space-y-1 text-left text-xs text-tb-muted">
              <li>
                {t('escoba.handSummary.cards')}:{' '}
                {view.lastHandSummary!.cardsWinner !== null ? seatLabel(view.lastHandSummary!.cardsWinner) : t('escoba.handSummary.nobody')}
              </li>
              <li>
                {t('escoba.handSummary.oros')}:{' '}
                {view.lastHandSummary!.orosWinner !== null ? seatLabel(view.lastHandSummary!.orosWinner) : t('escoba.handSummary.nobody')}
              </li>
              <li>
                {t('escoba.handSummary.velo')}:{' '}
                {view.lastHandSummary!.veloWinner !== null ? seatLabel(view.lastHandSummary!.veloWinner) : t('escoba.handSummary.nobody')}
              </li>
            </ul>
          }
          waitingFor={view.pendingConfirm.filter((s) => s !== mySeat).map((s) => seatLabel(s))}
          confirmed={confirmed}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
