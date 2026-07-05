import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TicTacToeView } from '@tableria/games';
import { matchSocket } from '../lib/ws';
import type { BoardProps } from './BoardProps';

function Cell({
  value,
  label,
  onClick,
  disabled,
  selected,
}: {
  value: 0 | 1 | null;
  label: string;
  onClick: () => void;
  disabled: boolean;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={selected}
      className={`flex aspect-square items-center justify-center rounded-xl border bg-tb-surface-2 font-display text-4xl font-extrabold transition-colors enabled:hover:bg-tb-accent-tint disabled:cursor-default ${
        selected ? 'border-tb-accent ring-2 ring-tb-accent' : 'border-tb-border'
      }`}
    >
      {value === 0 && <span className="text-tb-accent">X</span>}
      {value === 1 && <span className="text-tb-warn">O</span>}
    </button>
  );
}

export function TicTacToeBoard({ matchId, seq, mySeat, myTurn, view: rawView }: BoardProps) {
  const { t } = useTranslation();
  const view = rawView as TicTacToeView | undefined;
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  // Cada nuevo estado (nuestro movimiento o el del rival) invalida cualquier ficha
  // seleccionada a medio mover en la variante "Mover fichas".
  useEffect(() => {
    setSelectedCell(null);
  }, [seq]);

  const myPiecesOnBoard = view && mySeat !== null ? view.board.filter((c) => c === mySeat).length : 0;
  const inMovePhase = view?.variant === 'moving' && myPiecesOnBoard >= 3;

  function handleCellClick(cell: number) {
    if (!myTurn || !view || mySeat === null) return;

    if (!inMovePhase) {
      if (view.board[cell] !== null) return;
      matchSocket.send({ type: 'match.move', payload: { matchId, move: { cell } } });
      return;
    }

    if (selectedCell === null || view.board[cell] === mySeat) {
      // Sin selección todavía, o cambiando a otra ficha propia.
      if (view.board[cell] === mySeat) setSelectedCell(cell);
      return;
    }
    if (cell === selectedCell) {
      setSelectedCell(null);
      return;
    }
    if (view.board[cell] !== null) return; // casilla del rival: no se puede mover ahí
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { from: selectedCell, to: cell } } });
    setSelectedCell(null);
  }

  return (
    <>
      {myTurn && inMovePhase && (
        <p className="mb-3 text-center text-xs text-tb-muted">
          {selectedCell === null ? t('partida.selectPiece') : t('partida.selectDestination')}
        </p>
      )}
      <div role="grid" aria-label={t('partida.a11y.board')} className="grid grid-cols-3 gap-2">
        {(view?.board ?? Array(9).fill(null)).map((cell, i) => {
          const clickable =
            myTurn && (!inMovePhase ? cell === null : cell === mySeat || (selectedCell !== null && cell === null));
          const content =
            cell === null ? t('partida.a11y.empty') : cell === mySeat ? t('partida.a11y.myPiece') : t('partida.a11y.opponentPiece');
          const label = t('partida.a11y.cell', { row: Math.floor(i / 3) + 1, col: (i % 3) + 1, content });
          return (
            <Cell
              key={i}
              value={cell}
              label={label}
              onClick={() => handleCellClick(i)}
              disabled={!clickable}
              selected={selectedCell === i}
            />
          );
        })}
      </div>
    </>
  );
}
