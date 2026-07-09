import { useEffect, useState, type FormEvent } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ChatIcon, ClockIcon, CloseIcon } from '../components/icons';
import { MatchEndPanel } from '../components/MatchEndPanel';
import { UserHoverCard } from '../components/UserHoverCard';
import { VoiceCallBar } from '../components/VoiceCallBar';
import { BriscaBoard } from '../games/BriscaBoard';
import { ConnectFourBoard } from '../games/ConnectFourBoard';
import { CronolitoBoard } from '../games/CronolitoBoard';
import { EscobaBoard } from '../games/EscobaBoard';
import { PistaUnicaBoard } from '../games/PistaUnicaBoard';
import { ReversiBoard } from '../games/ReversiBoard';
import { TicTacToeBoard } from '../games/TicTacToeBoard';
import { TimbiricheBoard } from '../games/TimbiricheBoard';
import { TuteBoard } from '../games/TuteBoard';
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
  escoba: EscobaBoard,
  tute: TuteBoard,
  'tute-cabron': TuteBoard,
  cronolito: CronolitoBoard,
} as const;

// Preferencia personal de zoom del tablero — una sola vez por usuario (no por partida ni por
// juego): "cada uno ajusta a su gusto" es una preferencia estable, no una configuración puntual.
const ZOOM_STORAGE_KEY = 'tableria:boardZoom';
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 1.6;
const ZOOM_STEP = 0.1;

function readInitialZoom(): number {
  const raw = window.localStorage.getItem(ZOOM_STORAGE_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parsed)) : 1;
}

function MatchPage() {
  const { t } = useTranslation();
  const { id: matchId } = Route.useParams();
  const { me } = Route.useRouteContext();
  const [chatInput, setChatInput] = useState('');
  // Minimizar el chat de mesa a una burbuja libera su columna entera para el tablero — se
  // reabre con el botón "Chat" que aparece en su lugar en la cabecera.
  const [chatMinimized, setChatMinimized] = useState(false);
  const [zoom, setZoom] = useState(readInitialZoom);
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

  const timeoutPendingSeat = matchState?.timeoutPendingSeat ?? null;
  const isTimedOutSeat = mySeat !== null && timeoutPendingSeat === mySeat;
  const timedOutPlayer = timeoutPendingSeat !== null ? matchState?.players.find((p) => p.seat === timeoutPendingSeat) : undefined;
  const canClaimTimeoutVictory = !isSpectator && timeoutPendingSeat !== null && !isTimedOutSeat;

  function handleForfeit() {
    if (!window.confirm(t('partida.abandonConfirm'))) return;
    matchSocket.send({ type: 'match.forfeit', payload: { matchId } });
  }

  function handleClaimTimeoutVictory() {
    matchSocket.send({ type: 'match.claimTimeoutVictory', payload: { matchId } });
  }

  function adjustZoom(delta: number) {
    setZoom((z) => {
      const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((z + delta) * 100) / 100));
      window.localStorage.setItem(ZOOM_STORAGE_KEY, String(next));
      return next;
    });
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
    <section className="flex flex-col gap-4">
      <div role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <div>
        <div className="mb-0 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-tb-border p-1">
              <button
                type="button"
                onClick={() => adjustZoom(-ZOOM_STEP)}
                disabled={zoom <= ZOOM_MIN}
                aria-label={t('partida.zoomOut')}
                className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold text-tb-text hover:bg-tb-surface-2 disabled:opacity-30"
              >
                −
              </button>
              <span className="tb-nums w-9 text-center text-xs font-semibold text-tb-muted">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => adjustZoom(ZOOM_STEP)}
                disabled={zoom >= ZOOM_MAX}
                aria-label={t('partida.zoomIn')}
                className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold text-tb-text hover:bg-tb-surface-2 disabled:opacity-30"
              >
                +
              </button>
            </div>
            {chatMinimized && (
              <button
                type="button"
                onClick={() => setChatMinimized(false)}
                className="flex items-center gap-1.5 rounded-lg border border-tb-border px-3 py-1.5 text-xs font-medium text-tb-text hover:bg-tb-surface-2"
              >
                <ChatIcon className="h-3.5 w-3.5" />
                {t('partida.chatReopen')}
              </button>
            )}
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

        {!ended && timeoutPendingSeat !== null && (
          <p className="mb-3 rounded-lg bg-tb-warn-tint px-3 py-2 text-center text-xs font-medium text-tb-warn">
            {isTimedOutSeat
              ? t('partida.timeoutPendingSelf')
              : t('partida.timeoutPendingOpponent', { name: timedOutPlayer?.username ?? '' })}
            {canClaimTimeoutVictory && (
              <button
                type="button"
                onClick={handleClaimTimeoutVictory}
                className="ml-2 font-semibold underline hover:no-underline"
              >
                {t('partida.timeoutClaimVictory')}
              </button>
            )}
          </p>
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
      </div>

      {/* El tapete enmarca tablero y chat como objetos físicos sobre la mesa — cada uno en su
          propia tarjeta `--tb-surface` con marco/sombra, para que se separen del fondo en vez
          de fundirse con él. */}
      <div className={`tb-table-felt grid min-w-0 gap-6 rounded-3xl p-3 sm:p-5 lg:p-7 ${chatMinimized ? '' : 'md:grid-cols-[minmax(0,1fr)_320px]'}`}>
        {/* `min-w-0`: elemento directo de un grid — sin esto, `min-width: auto` implícito le
            impide encoger por debajo del contenido más ancho de dentro (p.ej. la fila de eventos
            de Cronolito), y el `overflow-x-auto` de más abajo deja de contener nada: el scroll
            horizontal se escapa a la página entera en vez de quedarse en esta tarjeta. */}
        <div className="min-w-0 rounded-2xl border border-tb-border/60 bg-tb-surface/95 p-3 shadow-xl backdrop-blur-sm sm:p-5">
          {/* `overflow-x-auto` es la red de seguridad: a zoom alto, un tablero intrínsecamente
              ancho (p.ej. Timbiriche 10x10) puede pedir más sitio del que da la columna — mejor un
              scroll horizontal contenido aquí que forzar el ancho de toda la página. */}
          <div className="overflow-x-auto">
            {/* El tablero se queda montado incluso tras el fin de partida (controles ya inertes
                porque activePlayers queda vacío) — así el resultado puede mostrarse como una capa
                semitransparente por encima, sin ocultar la posición final por detrás. `zoom` (no
                `transform: scale`) porque reordena el layout de verdad — el resto de la columna
                reacciona al nuevo tamaño en vez de que el tablero quede flotando por encima. */}
            <div className="relative" style={{ zoom }}>
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
                  players={matchState.players}
                />
              )}

              {ended && matchInfo && matchState && (
                <MatchEndPanel
                  matchId={matchId}
                  gameId={matchInfo.gameId}
                  gameName={matchInfo.gameName}
                  ended={ended}
                  players={matchState.players}
                  mySeat={mySeat}
                  isSpectator={isSpectator}
                  view={matchState.view}
                />
              )}
            </div>
          </div>
        </div>

        {!chatMinimized && (
          // En <md el chat se apila bajo el tablero: sin una altura propia acotada, la lista de
          // mensajes (overflow-y-auto) nunca scrollearía y la tarjeta crecería sin límite.
          <div className="flex h-[24rem] max-h-[60dvh] flex-col overflow-hidden rounded-2xl border border-tb-border/60 bg-tb-surface/95 shadow-xl backdrop-blur-sm md:h-auto md:max-h-none">
            <div className="flex items-center justify-between gap-2 border-b border-tb-border px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-tb-muted">
                <ChatIcon className="h-3.5 w-3.5" />
                {t('partida.chat')}
              </p>
              <button
                type="button"
                onClick={() => setChatMinimized(true)}
                aria-label={t('partida.chatMinimize')}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-tb-muted hover:bg-tb-surface-2 hover:text-tb-text"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {!isSpectator && !ended && matchInfo && (
              <VoiceCallBar room={{ kind: 'match', matchId }} label={matchInfo.gameName} meId={me.id} />
            )}

            <div className="flex-1 space-y-2 overflow-y-auto p-4 text-sm">
              {chat.length === 0 && <p className="text-xs text-tb-muted">{t('partida.chatEmpty')}</p>}
              {chat.map((m) => (
                <p key={m.id}>
                  <span className="font-semibold text-tb-text">{m.username}: </span>
                  <span className="text-tb-muted">{m.body}</span>
                </p>
              ))}
            </div>
            {chatBlockedError && <p className="px-4 text-xs font-medium text-tb-danger">{chatBlockedError}</p>}
            <form onSubmit={handleSendChat} className="flex gap-2 p-4 pt-0">
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
        )}
      </div>
    </section>
  );
}
