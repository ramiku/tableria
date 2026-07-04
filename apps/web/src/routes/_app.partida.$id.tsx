import { useEffect, useState, type FormEvent } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { TicTacToeView } from '@tableria/games';
import { ArrowLeftIcon, ChatIcon, ClockIcon, MedalIcon } from '../components/icons';
import { useCountdownSeconds } from '../lib/useCountdown';
import { matchSocket } from '../lib/ws';
import { useMatchStore } from '../stores/match';

export const Route = createFileRoute('/_app/partida/$id')({ component: MatchPage });

function Cell({ value, onClick, disabled }: { value: 0 | 1 | null; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || value !== null}
      className="flex aspect-square items-center justify-center rounded-xl border border-tb-border bg-tb-surface-2 font-display text-4xl font-extrabold transition-colors enabled:hover:bg-tb-accent-tint disabled:cursor-default"
    >
      {value === 0 && <span className="text-tb-accent">X</span>}
      {value === 1 && <span className="text-tb-warn">O</span>}
    </button>
  );
}

function MatchPage() {
  const { t } = useTranslation();
  const { id: matchId } = Route.useParams();
  const { me } = Route.useRouteContext();
  const [chatInput, setChatInput] = useState('');

  const matchState = useMatchStore((s) => s.matchState);
  const ended = useMatchStore((s) => s.ended);
  const chat = useMatchStore((s) => s.chat);
  const connectionStatus = useMatchStore((s) => s.connectionStatus);

  useEffect(() => {
    matchSocket.subscribe({ type: 'match.resume', payload: { matchId } });
    return () => useMatchStore.getState().reset();
  }, [matchId]);

  const deadline = useCountdownSeconds(matchState?.turnDeadlineAt ?? null);

  const mySeat = matchState?.players.find((p) => p.userId === me.id)?.seat ?? null;
  const isSpectator = mySeat === null;
  const view = matchState?.view as TicTacToeView | undefined;
  const myTurn = mySeat !== null && (matchState?.activePlayers.includes(mySeat) ?? false);

  function handleMove(cell: number) {
    if (!myTurn || !view || view.board[cell] !== null) return;
    matchSocket.send({ type: 'match.move', payload: { matchId, move: { cell } } });
  }

  function handleSendChat(e: FormEvent) {
    e.preventDefault();
    const body = chatInput.trim();
    if (!body) return;
    matchSocket.send({ type: 'chat.send', payload: { matchId, body } });
    setChatInput('');
  }

  if (!matchState && !ended) {
    return (
      <section className="mx-auto max-w-lg">
        <div className="h-96 animate-pulse rounded-2xl border border-tb-border bg-tb-surface-2" />
        {connectionStatus !== 'open' && (
          <p className="mt-3 text-center text-xs font-medium text-tb-warn">
            {t(`sala.connection.${connectionStatus}`)}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-3xl gap-6 md:grid-cols-[1fr_260px]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {matchState?.players.map((p) => (
              <span
                key={p.seat}
                className={`tb-nums flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                  matchState.activePlayers.includes(p.seat) && !ended
                    ? 'bg-tb-accent-tint text-tb-accent'
                    : 'text-tb-muted'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${p.connected ? 'bg-tb-success' : 'bg-tb-border'}`} />
                {p.username}
              </span>
            ))}
          </div>
          {deadline !== null && !ended && (
            <span className="tb-nums flex items-center gap-1.5 text-sm font-semibold text-tb-text">
              <ClockIcon className="h-4 w-4" />
              {deadline}s
            </span>
          )}
        </div>

        {connectionStatus !== 'open' && (
          <p className="mb-3 text-center text-xs font-medium text-tb-warn">
            {t(`sala.connection.${connectionStatus}`)}
          </p>
        )}

        {ended ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-tb-border bg-tb-surface p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tb-accent-tint text-tb-accent">
              <MedalIcon className="h-6 w-6" />
            </span>
            <h1 className="font-display text-xl font-bold">
              {t(ended.reason === 'forfeit' ? 'partida.endedForfeit' : 'partida.endedCompleted')}
            </h1>
            <p className="text-sm text-tb-muted">
              {isSpectator
                ? t('partida.resultSpectator')
                : t(
                    ended.ranking.find((r) => r.seat === mySeat)?.result === 'win'
                      ? 'partida.resultWin'
                      : ended.ranking.find((r) => r.seat === mySeat)?.result === 'draw'
                        ? 'partida.resultDraw'
                        : 'partida.resultLoss',
                  )}
            </p>
            <Link
              to="/"
              className="mt-2 flex items-center gap-1.5 rounded-lg border border-tb-border px-3.5 py-2 text-sm font-medium text-tb-text hover:bg-tb-surface-2"
            >
              <ArrowLeftIcon />
              {t('game.backToCatalog')}
            </Link>
          </div>
        ) : (
          <>
            {isSpectator && <p className="mb-3 text-center text-xs text-tb-muted">{t('partida.spectating')}</p>}
            {!isSpectator && (
              <p className="mb-3 text-center text-sm font-medium text-tb-text">
                {myTurn ? t('partida.yourTurn') : t('partida.opponentTurn')}
              </p>
            )}
            <div className="grid grid-cols-3 gap-2">
              {(view?.board ?? Array(9).fill(null)).map((cell, i) => (
                <Cell key={i} value={cell} onClick={() => handleMove(i)} disabled={!myTurn} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col rounded-2xl border border-tb-border bg-tb-surface p-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-tb-muted">
          <ChatIcon className="h-3.5 w-3.5" />
          {t('partida.chat')}
        </p>
        <div className="flex-1 space-y-2 overflow-y-auto text-sm">
          {chat.length === 0 && <p className="text-xs text-tb-muted">{t('partida.chatEmpty')}</p>}
          {chat.map((m) => (
            <p key={m.id}>
              <span className="font-semibold text-tb-text">{m.username}: </span>
              <span className="text-tb-muted">{m.body}</span>
            </p>
          ))}
        </div>
        <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={t('partida.chatPlaceholder')}
            className="w-full rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text placeholder:text-tb-muted"
          />
        </form>
      </div>
    </section>
  );
}
