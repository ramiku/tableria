import { CONNECT_FOUR_COLS, CONNECT_FOUR_ROWS, type ConnectFourView } from '@tableria/games';
import { matchSocket } from '../lib/ws';
import type { BoardProps } from './BoardProps';

export function ConnectFourBoard({ matchId, mySeat: _mySeat, myTurn, view: rawView }: BoardProps) {
  const view = rawView as ConnectFourView | undefined;
  const board = view?.board ?? Array(CONNECT_FOUR_ROWS * CONNECT_FOUR_COLS).fill(null);

  function handleDrop(column: number) {
    if (!myTurn || board[column] !== null) return; // fila superior ocupada = columna llena
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { column } } });
  }

  return (
    <div
      className="mx-auto grid w-fit gap-1.5 rounded-2xl border border-tb-border bg-tb-surface-2 p-3"
      style={{ gridTemplateColumns: `repeat(${CONNECT_FOUR_COLS}, minmax(0, 1fr))` }}
    >
      {board.map((cell, i) => {
        const column = i % CONNECT_FOUR_COLS;
        const columnFull = board[column] !== null;
        return (
          <button
            key={i}
            type="button"
            onClick={() => handleDrop(column)}
            disabled={!myTurn || columnFull}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-tb-surface p-1 transition-colors enabled:hover:bg-tb-accent-tint disabled:cursor-default sm:h-11 sm:w-11"
          >
            <span
              className={`h-full w-full rounded-full ${
                cell === 0 ? 'bg-tb-accent' : cell === 1 ? 'bg-tb-warn' : 'bg-tb-surface-2'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
