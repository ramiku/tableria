import { useEffect, useState, type FormEvent } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, ChatIcon, ClockIcon, MedalIcon, UsersIcon } from '../components/icons';
import { BriscaBoard } from '../games/BriscaBoard';
import { ConnectFourBoard } from '../games/ConnectFourBoard';
import { PistaUnicaBoard } from '../games/PistaUnicaBoard';
import { ReversiBoard } from '../games/ReversiBoard';
import { TicTacToeBoard } from '../games/TicTacToeBoard';
import { formatDuration } from '../lib/formatDuration';
import { useFriendsList } from '../lib/friends';
import { trpc } from '../lib/trpc';
import { useCountdownSeconds } from '../lib/useCountdown';
import { matchSocket } from '../lib/ws';
import { useMatchStore } from '../stores/match';

export const Route = createFileRoute('/_app/partida/$id')({ component: MatchPage });

function InviteFriendButton({ matchId }: { matchId: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { friends } = useFriendsList();
  const onlineFriends = friends.filter((f) => f.presence !== 'offline');
  const getOrCreateDirect = trpc.conversations.getOrCreateDirect.useMutation();

  function invite(friendId: string) {
    getOrCreateDirect.mutate(
      { friendId },
      {
        onSuccess: ({ conversationId }) => {
          matchSocket.send({
            type: 'dm.send',
            payload: { conversationId, body: t('partida.inviteMessageBody'), kind: 'invite', matchId },
          });
          setOpen(false);
        },
      },
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-tb-border px-3 py-1.5 text-xs font-medium text-tb-text hover:bg-tb-surface-2"
      >
        <UsersIcon className="h-3.5 w-3.5" />
        {t('partida.inviteFriend')}
      </button>
      {open && (
        <>
          <div role="presentation" className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-tb-border bg-tb-surface p-2 shadow-lg">
            {onlineFriends.length === 0 ? (
              <p className="p-2 text-xs text-tb-muted">{t('partida.noOnlineFriends')}</p>
            ) : (
              onlineFriends.map((f) => (
                <button
                  key={f.userId}
                  type="button"
                  onClick={() => invite(f.userId)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-tb-text hover:bg-tb-surface-2"
                >
                  {f.displayName}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

const BOARD_COMPONENTS = {
  'tres-en-raya': TicTacToeBoard,
  'conecta-cuatro': ConnectFourBoard,
  brisca: BriscaBoard,
  reversi: ReversiBoard,
  'pista-unica': PistaUnicaBoard,
} as const;

function MatchPage() {
  const { t } = useTranslation();
  const { id: matchId } = Route.useParams();
  const { me } = Route.useRouteContext();
  const [chatInput, setChatInput] = useState('');

  const matchState = useMatchStore((s) => s.matchState);
  const ended = useMatchStore((s) => s.ended);
  const chat = useMatchStore((s) => s.chat);
  const connectionStatus = useMatchStore((s) => s.connectionStatus);
  const { data: matchInfo } = trpc.matches.getById.useQuery({ matchId });

  useEffect(() => {
    matchSocket.subscribe({ type: 'match.resume', payload: { matchId } });
    return () => useMatchStore.getState().reset();
  }, [matchId]);

  const deadline = useCountdownSeconds(matchState?.turnDeadlineAt ?? null);

  const mySeat = matchState?.players.find((p) => p.userId === me.id)?.seat ?? null;
  const isSpectator = mySeat === null;
  const myTurn = mySeat !== null && (matchState?.activePlayers.includes(mySeat) ?? false);
  const BoardComponent = matchInfo ? BOARD_COMPONENTS[matchInfo.gameId as keyof typeof BOARD_COMPONENTS] : undefined;

  // Región para lectores de pantalla: anuncia cambios de turno y el resultado final,
  // que de otro modo son puramente visuales (color/negrita del chip de jugador).
  const liveMessage = ended
    ? isSpectator
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
      <div role="status" aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
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
          <div className="flex items-center gap-2">
            {deadline !== null && !ended && (
              <span className="tb-nums flex items-center gap-1.5 text-sm font-semibold text-tb-text">
                <ClockIcon className="h-4 w-4" />
                {formatDuration(deadline)}
              </span>
            )}
            {!isSpectator && !ended && <InviteFriendButton matchId={matchId} />}
          </div>
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
        ) : (
          <>
            {isSpectator && <p className="mb-3 text-center text-xs text-tb-muted">{t('partida.spectating')}</p>}
            {/* Pista Única es cooperativo entre 3-8 jugadores y su propio tablero ya explica de
                quién es el turno con más matiz ("eres quien adivina" / pistas pendientes, etc.) —
                el genérico "turno del rival" no encaja y sobra aquí. */}
            {!isSpectator && matchInfo?.gameId !== 'pista-unica' && (
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
            aria-label={t('partida.chatPlaceholder')}
            className="w-full rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text placeholder:text-tb-muted"
          />
        </form>
      </div>
    </section>
  );
}
