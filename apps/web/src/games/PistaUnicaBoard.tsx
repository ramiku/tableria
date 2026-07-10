import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { PistaUnicaView } from '@tableria/games';
import { matchSocket } from '../lib/ws';
import type { BoardProps } from './BoardProps';

export function PistaUnicaBoard({ matchId, seq, mySeat, myTurn, view: rawView }: BoardProps) {
  const { t } = useTranslation();
  const view = rawView as PistaUnicaView | undefined;
  const [input, setInput] = useState('');

  useEffect(() => {
    setInput('');
  }, [seq]);

  if (!view) return null;

  const isGuesser = mySeat !== null && mySeat === view.guesser;
  const myClue = mySeat !== null ? view.clues[mySeat] : null;
  const alreadySubmittedClue = !isGuesser && myClue !== null;
  const cluesSubmittedCount = view.submitted.filter(Boolean).length;
  const cluesNeeded = view.numPlayers - 1;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const word = input.trim();
    if (!word || !myTurn) return;
    const type = view!.phase === 'clue' ? 'clue' : 'guess';
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { type, word } } });
    setInput('');
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <p className="tb-nums text-center text-xs font-semibold uppercase tracking-wide text-tb-muted">
        {t('partida.pistaUnica.round', { round: view.round + 1, total: view.totalRounds })}
        {' · '}
        {t('partida.pistaUnica.score', { score: view.score, total: view.totalRounds })}
      </p>

      {view.phase === 'clue' && isGuesser && (
        <div className="rounded-2xl border border-tb-border bg-tb-surface p-6 text-center">
          <p className="font-display text-lg font-bold text-tb-text">{t('partida.pistaUnica.youAreGuesser')}</p>
          <p className="mt-2 text-sm text-tb-muted">
            {t('partida.pistaUnica.waitingForClues', { submitted: cluesSubmittedCount, total: cluesNeeded })}
          </p>
        </div>
      )}

      {view.phase === 'clue' && !isGuesser && (
        <div className="rounded-2xl border border-tb-border bg-tb-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('partida.pistaUnica.secretWordLabel')}</p>
          <p className="font-display text-2xl font-extrabold text-tb-accent">{view.secretWord}</p>

          {alreadySubmittedClue ? (
            <p className="mt-4 text-sm text-tb-muted">{t('partida.pistaUnica.clueSubmitted', { clue: myClue })}</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={30}
                disabled={!myTurn}
                aria-label={t('partida.pistaUnica.clueInputLabel')}
                placeholder={t('partida.pistaUnica.clueInputLabel')}
                className="flex-1 rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-2 text-sm text-tb-text"
              />
              <button
                type="submit"
                disabled={!myTurn || !input.trim()}
                className="tb-gradient-cta rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {t('partida.pistaUnica.submitClue')}
              </button>
            </form>
          )}
        </div>
      )}

      {view.phase === 'guess' && (
        <div className="rounded-2xl border border-tb-border bg-tb-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('partida.pistaUnica.cluesLabel')}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {view.clues.map((clue, seat) =>
              seat === view.guesser ? null : (
                <li
                  key={seat}
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    view.clueValid[seat]
                      ? 'bg-tb-accent-tint text-tb-accent'
                      : 'bg-tb-surface-2 text-tb-muted line-through'
                  }`}
                >
                  {clue ?? t('partida.pistaUnica.clueHidden')}
                </li>
              ),
            )}
          </ul>

          {isGuesser ? (
            <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={30}
                disabled={!myTurn}
                aria-label={t('partida.pistaUnica.guessInputLabel')}
                placeholder={t('partida.pistaUnica.guessInputLabel')}
                className="flex-1 rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-2 text-sm text-tb-text"
              />
              <button
                type="submit"
                disabled={!myTurn || !input.trim()}
                className="tb-gradient-cta rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {t('partida.pistaUnica.submitGuess')}
              </button>
            </form>
          ) : (
            <p className="mt-5 text-sm text-tb-muted">{t('partida.pistaUnica.waitingForGuess')}</p>
          )}
        </div>
      )}

      {view.history.length > 0 && (
        <div className="rounded-2xl border border-tb-border bg-tb-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('partida.pistaUnica.historyTitle')}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {[...view.history].reverse().map((entry) => (
              <li key={entry.round} className="flex items-center gap-2 text-sm">
                <span className={entry.correct ? 'text-tb-success' : 'text-tb-danger'}>{entry.correct ? '✓' : '✗'}</span>
                <span className="text-tb-text">
                  {t(entry.correct ? 'partida.pistaUnica.historyCorrect' : 'partida.pistaUnica.historyWrong', {
                    word: entry.secretWord,
                    guess: entry.guess,
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
