import { useTranslation } from 'react-i18next';
import { REVERSI_SIZE, type ReversiView } from '@tableria/games';
import { matchSocket } from '../lib/ws';
import type { BoardProps } from './BoardProps';

export function ReversiBoard({ matchId, mySeat, myTurn, view: rawView }: BoardProps) {
  const { t } = useTranslation();
  const view = rawView as ReversiView | undefined;
  const board = view?.board ?? Array(REVERSI_SIZE * REVERSI_SIZE).fill(null);
  const legalMoves = view?.legalMoves ?? [];
  const mustPass = myTurn && legalMoves.length === 0;

  function handlePlace(cell: number) {
    if (!myTurn || !legalMoves.includes(cell)) return;
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { type: 'place', cell } } });
  }

  function handlePass() {
    if (!mustPass) return;
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { type: 'pass' } } });
  }

  return (
    <>
      {mustPass && (
        <p className="mb-3 text-center text-xs text-tb-muted">
          {t('partida.mustPass')}{' '}
          <button
            type="button"
            onClick={handlePass}
            className="font-semibold text-tb-accent underline underline-offset-2"
          >
            {t('partida.pass')}
          </button>
        </p>
      )}
      <div
        role="grid"
        aria-label={t('partida.a11y.board')}
        className="mx-auto grid w-fit gap-1 rounded-2xl border border-tb-border bg-tb-surface-2 p-3"
        style={{ gridTemplateColumns: `repeat(${REVERSI_SIZE}, minmax(0, 1fr))` }}
      >
        {board.map((cell, i) => {
          const row = Math.floor(i / REVERSI_SIZE);
          const col = i % REVERSI_SIZE;
          const legal = myTurn && legalMoves.includes(i);
          const content =
            cell === null
              ? legal
                ? t('partida.a11y.legalMove')
                : t('partida.a11y.empty')
              : cell === mySeat
                ? t('partida.a11y.myPiece')
                : t('partida.a11y.opponentPiece');
          return (
            <button
              key={i}
              type="button"
              onClick={() => handlePlace(i)}
              disabled={!legal}
              aria-label={t('partida.a11y.cell', { row: row + 1, col: col + 1, content })}
              className={`flex h-8 w-8 items-center justify-center rounded-md bg-tb-surface transition-colors enabled:hover:bg-tb-accent-tint disabled:cursor-default sm:h-10 sm:w-10 ${
                legal ? 'ring-1 ring-inset ring-tb-accent/50' : ''
              }`}
            >
              {cell !== null && (
                <span className={`h-full w-full rounded-full ${cell === 0 ? 'bg-tb-accent' : 'bg-tb-warn'}`} />
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
