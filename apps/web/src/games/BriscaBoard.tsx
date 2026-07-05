import { useTranslation } from 'react-i18next';
import type { BriscaPlayerView } from '@tableria/games';
import { matchSocket } from '../lib/ws';
import type { BoardProps } from './BoardProps';

const SUIT_LABEL: Record<string, string> = { oros: 'Oros', copas: 'Copas', espadas: 'Espadas', bastos: 'Bastos' };
const SUIT_COLOR: Record<string, string> = { oros: '#a9791f', copas: '#ad3141', espadas: '#2f6fe0', bastos: '#2f7d4f' };
const RANK_LABEL: Record<number, string> = { 1: 'As', 10: 'Sota', 11: 'Caballo', 12: 'Rey' };

function cardLabel(rank: number): string {
  return RANK_LABEL[rank] ?? String(rank);
}

function CardFace({ suit, rank }: { suit: string; rank: number }) {
  return (
    <span
      className="flex h-20 w-14 flex-col items-center justify-between rounded-lg border border-tb-border p-1.5 text-white shadow-sm sm:h-24 sm:w-16"
      style={{ background: SUIT_COLOR[suit] }}
    >
      <span className="font-display text-sm font-extrabold">{cardLabel(rank)}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-90">{SUIT_LABEL[suit]}</span>
    </span>
  );
}

function CardBack() {
  return <span className="h-20 w-14 rounded-lg border border-tb-border bg-tb-surface-2 sm:h-24 sm:w-16" />;
}

export function BriscaBoard({ matchId, mySeat, myTurn, view: rawView }: BoardProps) {
  const { t } = useTranslation();
  const view = rawView as BriscaPlayerView | undefined;
  if (!view) return null;

  function handlePlay(cardIndex: number) {
    if (!myTurn) return;
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { cardIndex } } });
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('brisca.trump')}</span>
          <CardFace suit={view.trumpCard.suit} rank={view.trumpCard.rank} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">
          {t('brisca.deck')}: <span className="tb-nums text-tb-text">{view.deckCount}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {view.points.map((p, seat) => (
            <span
              key={seat}
              className={`tb-nums rounded-full px-2.5 py-1 text-xs font-bold ${
                seat === mySeat ? 'bg-tb-accent-tint text-tb-accent' : 'bg-tb-surface-2 text-tb-muted'
              }`}
            >
              {seat === mySeat ? t('brisca.you') : t('brisca.seat', { n: seat + 1 })}: {p}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        {view.currentTrick.map((c, seat) => (c ? <CardFace key={seat} suit={c.suit} rank={c.rank} /> : <CardBack key={seat} />))}
      </div>

      {view.hand && (
        <div className="flex gap-3">
          {view.hand.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handlePlay(i)}
              disabled={!myTurn}
              aria-label={`${cardLabel(c.rank)} de ${SUIT_LABEL[c.suit]}`}
              className="transition-transform enabled:hover:-translate-y-1 disabled:cursor-default disabled:opacity-70"
            >
              <CardFace suit={c.suit} rank={c.rank} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
