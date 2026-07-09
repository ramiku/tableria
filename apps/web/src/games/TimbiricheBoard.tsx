import { useTranslation } from 'react-i18next';
import { TIMBIRICHE_BOARD_PRESETS, TIMBIRICHE_DEFAULT_PRESET, type TimbiricheView } from '@tableria/games';
import { matchSocket } from '../lib/ws';
import type { BoardProps } from './BoardProps';

const DOT = 14;
const LINE = 40;
/** Un color por asiento (hasta 4) — tokens del tema, no hex fijos, porque aquí no hay "ficha física". */
const SEAT_BG = ['bg-tb-accent', 'bg-tb-warn', 'bg-tb-danger', 'bg-tb-success'] as const;

const DEFAULT_SIZE = TIMBIRICHE_BOARD_PRESETS[TIMBIRICHE_DEFAULT_PRESET];

function track(count: number): string {
  return Array.from({ length: 2 * count + 1 }, (_, i) => (i % 2 === 0 ? `${DOT}px` : `${LINE}px`)).join(' ');
}

export function TimbiricheBoard({ matchId, mySeat, myTurn, view: rawView }: BoardProps) {
  const { t } = useTranslation();
  const view = rawView as TimbiricheView | undefined;
  const rows = view?.rows ?? DEFAULT_SIZE.rows;
  const cols = view?.cols ?? DEFAULT_SIZE.cols;
  const hEdges = view?.hEdges ?? Array.from({ length: rows + 1 }, () => Array(cols).fill(null));
  const vEdges = view?.vEdges ?? Array.from({ length: rows }, () => Array(cols + 1).fill(null));
  const boxOwner = view?.boxOwner ?? Array.from({ length: rows }, () => Array(cols).fill(null));
  const scores = view?.scores ?? [];

  function handleEdge(orientation: 'h' | 'v', row: number, col: number, taken: boolean) {
    if (!myTurn || taken) return;
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { orientation, row, col } } });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {scores.map((score, seat) => (
          <span
            key={seat}
            className={`tb-nums flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              seat === mySeat ? 'ring-2 ring-tb-accent' : ''
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${SEAT_BG[seat % SEAT_BG.length]}`} />
            {score}
          </span>
        ))}
      </div>

      <div
        role="grid"
        aria-label={t('partida.a11y.board')}
        className="grid rounded-2xl border border-tb-border bg-tb-surface-2 p-4"
        style={{ gridTemplateColumns: track(cols), gridTemplateRows: track(rows) }}
      >
        {Array.from({ length: rows + 1 }, (_, r) =>
          Array.from({ length: cols + 1 }, (_, c) => (
            <span
              key={`dot-${r}-${c}`}
              className="h-3.5 w-3.5 justify-self-center self-center rounded-full bg-tb-muted"
              style={{ gridColumn: 2 * c + 1, gridRow: 2 * r + 1 }}
            />
          )),
        )}

        {hEdges.map((line, r) =>
          line.map((owner, c) => (
            <button
              key={`h-${r}-${c}`}
              type="button"
              onClick={() => handleEdge('h', r, c, owner !== null)}
              disabled={!myTurn || owner !== null}
              aria-label={t('partida.a11y.edge', { row: r + 1, col: c + 1 })}
              style={{ gridColumn: 2 * c + 2, gridRow: 2 * r + 1 }}
              className={`h-3 justify-self-stretch self-center rounded-full transition-colors ${
                owner !== null ? SEAT_BG[owner % SEAT_BG.length] : 'bg-tb-border enabled:hover:bg-tb-accent/50'
              } disabled:cursor-default`}
            />
          )),
        )}

        {vEdges.map((line, r) =>
          line.map((owner, c) => (
            <button
              key={`v-${r}-${c}`}
              type="button"
              onClick={() => handleEdge('v', r, c, owner !== null)}
              disabled={!myTurn || owner !== null}
              aria-label={t('partida.a11y.edge', { row: r + 1, col: c + 1 })}
              style={{ gridColumn: 2 * c + 1, gridRow: 2 * r + 2 }}
              className={`w-3 justify-self-center self-stretch rounded-full transition-colors ${
                owner !== null ? SEAT_BG[owner % SEAT_BG.length] : 'bg-tb-border enabled:hover:bg-tb-accent/50'
              } disabled:cursor-default`}
            />
          )),
        )}

        {boxOwner.map((line, r) =>
          line.map((owner, c) => (
            <span
              key={`box-${r}-${c}`}
              aria-label={owner !== null ? t('partida.a11y.box', { owner: owner + 1 }) : undefined}
              style={{ gridColumn: 2 * c + 2, gridRow: 2 * r + 2 }}
              className={`rounded-sm transition-colors ${owner !== null ? `${SEAT_BG[owner % SEAT_BG.length]} opacity-25` : ''}`}
            />
          )),
        )}
      </div>
    </div>
  );
}
