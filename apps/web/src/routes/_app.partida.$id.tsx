import { useEffect, useState, type FormEvent } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, ChatIcon, ClockIcon, MedalIcon } from '../components/icons';
import { UserHoverCard } from '../components/UserHoverCard';
import { VoiceCallBar } from '../components/VoiceCallBar';
import { BriscaBoard } from '../games/BriscaBoard';
import { ConnectFourBoard } from '../games/ConnectFourBoard';
import { PistaUnicaBoard } from '../games/PistaUnicaBoard';
import { ReversiBoard } from '../games/ReversiBoard';
import { TicTacToeBoard } from '../games/TicTacToeBoard';
import { TimbiricheBoard } from '../games/TimbiricheBoard';
import { formatDuration } from '../lib/formatDuration';
import { trpc } from '../lib/trpc';
import { useCountdownSeconds } from '../lib/useCountdown';
import { matchSocket } from '../lib/ws';
import { useMatchStore } from '../stores/match';

export const Route = createFileRoute('/_app/partida/$id')({ component: MatchPage });

const BOARD_COMPONENTS = {
  'tres-en-raya': TicTacToeBoard,
  'conecta-cuatro': ConnectFourBoard,
  brisca: BriscaBoard,
  reversi: ReversiBoard,
  'pista-unica': PistaUnicaBoard,
  timbiriche: TimbiricheBoard,
} as const;

function MatchPage() {
  const { t } = useTranslation();
  const { id: matchId } = Route.useParams();
  const { me } = Route.useRouteContext();
  const [chatInput, setChatInput] = useState('');
  const utils = trpc.useUtils();

  const matchState = useMatchStore((s) => s.matchState);
  const ended = useMatchStore((s) => s.ended);
  const chat = useMatchStore((s) => s.chat);
  const connectionStatus = useMatchStore((s) => s.connectionStatus);
  const abandonRequestedSeats = useMatchStore((s) => s.abandonRequestedSeats);
  const chatBlockedError = useMatchStore((s) => s.chatBlockedError);
  const clearChatBlockedError = useMatchStore((s) => s.clearChatBlockedError);
  const { data: matchInfo } = trpc.matches.getById.useQuery({ matchId });

  useEffect(() => {
    matchSocket.subscribe({ type: 'match.resume', payload: { matchId } });
    return () => useMatchStore.getState().reset();
  }, [matchId]);

  // No basta con invalidate(): como en este momento nadie más tiene la query myActive montada
  // (el lobby del juego no está en pantalla), invalidate() solo la marca "stale" pero no la
  // refetchea. Al volver a entrar en la ficha del juego, React Query pinta primero el dato
  // cacheado (todavía "in_game") antes de que llegue la respuesta fresca, así que se ve el
  // "Reanudar" de una partida ya terminada y hace falta un segundo intento para que se corrija.
  // Limpiamos la caché a mano en cuanto sabemos que la partida acabó, sin esperar al refetch.
  useEffect(() => {
    if (!ended) return;
    utils.matches.myActive.setData(undefined, (prev) => (prev?.matchId === matchId ? null : prev));
    void utils.matches.myActive.invalidate();
  }, [ended, utils, matchId]);

  const deadline = useCountdownSeconds(matchState?.turnDeadlineAt ?? null);

  const mySeat = matchState?.players.find((p) => p.userId === me.id)?.seat ?? null;
  const isSpectator = mySeat === null;
  const myTurn = mySeat !== null && (matchState?.activePlayers.includes(mySeat) ?? false);
  const BoardComponent = matchInfo ? BOARD_COMPONENTS[matchInfo.gameId as keyof typeof BOARD_COMPONENTS] : undefined;

  // Región para lectores de pantalla: anuncia cambios de turno y el resultado final,
  // que de otro modo son puramente visuales (color/negrita del chip de jugador).
  const liveMessage = ended
    ? ended.reason === 'abandoned'
      ? t('partida.resultAbandoned')
      : isSpectator
        ? t('partida.resultSpectator')
        : t(
            ended.ranking.find((r) => r.seat === mySeat)?.result === 'win'
              ? 'partida.resultWin'
              : ended.ranking.find((r) => r.seat === mySeat)?.result === 'draw'
                ? 'partida.resultDraw'
                : 'partida.resultLoss',
          )
    : !isSpectator
      ? myTurn
        ? t('partida.yourTurn')
        : t('partida.opponentTurn')
      : '';

  const iRequestedAbandon = mySeat !== null && abandonRequestedSeats.includes(mySeat);
  const othersRequestingAbandon = (matchState?.players ?? []).filter(
    (p) => p.seat !== mySeat && abandonRequestedSeats.includes(p.seat),
  );

  function handleForfeit() {
    if (!window.confirm(t('partida.abandonConfirm'))) return;
    matchSocket.send({ type: 'match.forfeit', payload: { matchId } });
  }

  function handleToggleAbandonRequest() {
    matchSocket.send({
      type: iRequestedAbandon ? 'match.abandonCancel' : 'match.abandonRequest',
      payload: { matchId },
    });
  }

  function handleSendChat(e: FormEvent) {
    e.preventDefault();
    clearChatBlockedError();
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
      <div role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {matchState?.players.map((p) => (
              <UserHoverCard key={p.seat} userId={p.userId} matchId={p.userId !== me.id ? matchId : undefined}>
                <span
                  className={`tb-nums flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
                    matchState.activePlayers.includes(p.seat) && !ended
                      ? 'bg-tb-accent-tint text-tb-accent'
                      : 'text-tb-muted'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${p.connected ? 'bg-tb-success' : 'bg-tb-border'}`} />
                  {p.username}
                </span>
              </UserHoverCard>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {deadline !== null && !ended && (
              <span className="tb-nums flex items-center gap-1.5 text-sm font-semibold text-tb-text">
                <ClockIcon className="h-4 w-4" />
                {formatDuration(deadline)}
              </span>
            )}
            {!isSpectator && !ended && (
              <button
                type="button"
                onClick={handleToggleAbandonRequest}
                className="rounded-lg border border-tb-border px-3 py-1.5 text-xs font-medium text-tb-text hover:bg-tb-surface-2"
              >
                {iRequestedAbandon ? t('partida.abandonCancelPropose') : t('partida.abandonPropose')}
              </button>
            )}
            {!isSpectator && !ended && (
              <button
                type="button"
                onClick={handleForfeit}
                className="rounded-lg border border-tb-border px-3 py-1.5 text-xs font-medium text-tb-muted hover:border-tb-danger hover:text-tb-danger"
              >
                {t('partida.abandon')}
              </button>
            )}
          </div>
        </div>

        {!isSpectator && !ended && matchInfo && (
          <div className="mb-3 rounded-2xl border border-tb-border">
            <VoiceCallBar
              room={{ kind: 'match', matchId }}
              label={matchInfo.gameName}
              meId={me.id}
            />
          </div>
        )}

        {!ended && (iRequestedAbandon || othersRequestingAbandon.length > 0) && (
          <p className="mb-3 rounded-lg bg-tb-accent-tint px-3 py-2 text-center text-xs font-medium text-tb-accent">
            {iRequestedAbandon
              ? t('partida.abandonStatusMineWaiting')
              : t('partida.abandonStatusOthersPending', {
                  names: othersRequestingAbandon.map((p) => p.username).join(', '),
                })}
            {!iRequestedAbandon && (
              <button
                type="button"
                onClick={handleToggleAbandonRequest}
                className="ml-2 font-semibold underline hover:no-underline"
              >
                {t('partida.abandonAccept')}
              </button>
            )}
          </p>
        )}

        {connectionStatus !== 'open' && (
          <p className="mb-3 text-center text-xs font-medium text-tb-warn">
            {t(`sala.connection.${connectionStatus}`)}
          </p>
        )}

        {/* El tablero se queda montado incluso tras el fin de partida (controles ya inertes
            porque activePlayers queda vacío) — así el resultado puede mostrarse como una capa
            semitransparente por encima, sin ocultar la posición final por detrás. */}
        <div className="relative">
          {isSpectator && !ended && <p className="mb-3 text-center text-xs text-tb-muted">{t('partida.spectating')}</p>}
          {/* Pista Única es cooperativo entre 3-8 jugadores y su propio tablero ya explica de
              quién es el turno con más matiz ("eres quien adivina" / pistas pendientes, etc.) —
              el genérico "turno del rival" no encaja y sobra aquí. */}
          {!isSpectator && !ended && matchInfo?.gameId !== 'pista-unica' && (
            <p className="mb-1 text-center text-sm font-medium text-tb-text">
              {myTurn ? t('partida.yourTurn') : t('partida.opponentTurn')}
            </p>
          )}
          {BoardComponent && matchState && (
            <BoardComponent
              matchId={matchId}
              seq={matchState.seq}
              mySeat={mySeat}
              myTurn={myTurn}
              view={matchState.view}
            />
          )}

          {ended && (
            <div className="tb-modal-in absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-tb-surface/25 p-4">
              <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-tb-border bg-tb-surface/95 p-7 text-center shadow-2xl backdrop-blur-md">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tb-accent-tint text-tb-accent">
                  <MedalIcon className="h-6 w-6" />
                </span>
                <h1 className="font-display text-xl font-bold">
                  {t(
                    ended.reason === 'abandoned'
                      ? 'partida.endedAbandoned'
                      : ended.reason === 'forfeit'
                        ? 'partida.endedForfeit'
                        : 'partida.endedCompleted',
                  )}
                </h1>
                <p className="text-sm text-tb-muted">
                  {ended.reason === 'abandoned'
                    ? t('partida.resultAbandoned')
                    : isSpectator
                      ? t('partida.resultSpectator')
                      : t(
                          ended.ranking.find((r) => r.seat === mySeat)?.result === 'win'
                            ? 'partida.resultWin'
                            : ended.ranking.find((r) => r.seat === mySeat)?.result === 'draw'
                              ? 'partida.resultDraw'
                              : 'partida.resultLoss',
                        )}
                </p>
                {!isSpectator &&
                  (() => {
                    const delta = ended.ratingDeltas?.find((d) => d.seat === mySeat);
                    if (!delta) return null;
                    const change = Math.round(delta.ratingAfter - delta.ratingBefore);
                    return (
                      <p className="tb-nums text-sm font-semibold">
                        {Math.round(delta.ratingBefore)} → {Math.round(delta.ratingAfter)}{' '}
                        <span className={change >= 0 ? 'text-tb-success' : 'text-tb-danger'}>
                          ({change >= 0 ? '+' : ''}
                          {change})
                        </span>
                      </p>
                    );
                  })()}
                <Link
                  to="/"
                  className="mt-2 flex items-center gap-1.5 rounded-lg border border-tb-border px-3.5 py-2 text-sm font-medium text-tb-text hover:bg-tb-surface-2"
                >
                  <ArrowLeftIcon />
                  {t('game.backToCatalog')}
                </Link>
              </div>
            </div>
          )}
        </div>
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
        {chatBlockedError && <p className="mt-2 text-xs font-medium text-tb-danger">{chatBlockedError}</p>}
        <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={t('partida.chatPlaceholder')}
            aria-label={t('partida.chatPlaceholder')}
            className="w-full rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text placeholder:text-tb-muted"
          />
        </form>
      </div>
    </section>
  );
}
