import { useEffect, useState } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { UsersIcon } from '../components/icons';
import { UserHoverCard } from '../components/UserHoverCard';
import { trpc } from '../lib/trpc';
import { matchSocket } from '../lib/ws';
import { useMatchStore } from '../stores/match';

export const Route = createFileRoute('/_app/sala/$code')({ component: RoomPage });

function RoomPage() {
  const { t } = useTranslation();
  const { code } = Route.useParams();
  const { me } = Route.useRouteContext();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.matches.getByCode.useQuery({ code });
  const lobby = useMatchStore((s) => s.lobby);
  const matchState = useMatchStore((s) => s.matchState);
  const connectionStatus = useMatchStore((s) => s.connectionStatus);
  const setReady = trpc.matches.setReady.useMutation();
  const [joinError, setJoinError] = useState('');
  const [leaveError, setLeaveError] = useState('');

  const matchId = data?.matchId ?? null;
  const joinMatch = trpc.matches.join.useMutation();
  const leaveMatch = trpc.matches.leave.useMutation({
    onSuccess: () => void navigate({ to: '/salas' }),
    onError: (err) => setLeaveError(err.message),
  });

  // Al llegar a la sala (crearla, pulsar "Entrar" en la lista o abrir un enlace
  // compartido) puede que todavía no tengamos asiento — nos unimos primero por
  // tRPC y solo luego suscribimos el WS como jugador; si la sala ya no admite
  // jugadores, nos quedamos viéndola como espectador en vez de quedar colgados.
  useEffect(() => {
    if (!matchId) return;
    joinMatch.mutate(
      { code },
      {
        onSuccess: () => matchSocket.subscribe({ type: 'match.join', payload: { matchId } }),
        onError: (err) => {
          setJoinError(err.message);
          matchSocket.subscribe({ type: 'match.watch', payload: { matchId } });
        },
      },
    );
    return () => useMatchStore.getState().reset();
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    if (data?.state === 'in_game' || matchState) {
      void navigate({ to: '/partida/$id', params: { id: matchId } });
    }
  }, [data?.state, matchState, matchId, navigate]);

  // El anfitrión puede irse mientras el resto ya está aquí confirmando "listo" — se entera
  // por WS en vivo (el snapshot REST de `data.state` no se actualiza solo). En ese momento
  // "mi mesa activa" también deja de apuntar a esta partida.
  useEffect(() => {
    if (lobby?.state === 'cancelled') void utils.matches.myActive.invalidate();
  }, [lobby?.state, utils]);

  if (isLoading) {
    return (
      <section>
        <div className="mx-auto h-72 max-w-lg animate-pulse rounded-2xl border border-tb-border bg-tb-surface-2" />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-display text-xl font-bold">{t('sala.notFound')}</h1>
        <Link
          to="/salas"
          className="mt-2 rounded-lg border border-tb-border px-3.5 py-2 text-sm font-medium text-tb-text hover:bg-tb-surface-2"
        >
          {t('sala.backToRooms')}
        </Link>
      </section>
    );
  }

  if (data.state === 'cancelled' || lobby?.state === 'cancelled') {
    return (
      <section className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-display text-xl font-bold">{t('sala.cancelledByHost')}</h1>
        <Link
          to="/juegos/$slug"
          params={{ slug: data.gameId }}
          className="mt-2 rounded-lg border border-tb-border px-3.5 py-2 text-sm font-medium text-tb-text hover:bg-tb-surface-2"
        >
          {t('sala.backToGame')}
        </Link>
      </section>
    );
  }

  if (data.state === 'finished' || data.state === 'abandoned') {
    return (
      <section className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-display text-xl font-bold">{t('sala.notActive')}</h1>
        <Link
          to="/salas"
          className="mt-2 rounded-lg border border-tb-border px-3.5 py-2 text-sm font-medium text-tb-text hover:bg-tb-surface-2"
        >
          {t('sala.backToRooms')}
        </Link>
      </section>
    );
  }

  const seats = lobby?.seats ?? [];
  const mySeat = seats.find((s) => s.userId === me.id);

  function toggleReady() {
    if (!matchId || !mySeat) return;
    setReady.mutate({ matchId, ready: !mySeat.ready });
  }

  function handleLeave() {
    if (!matchId) return;
    leaveMatch.mutate({ matchId });
  }

  return (
    <section className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-tb-border bg-tb-surface p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-tb-muted">{t('sala.title')}</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-tb-text">{data.gameName}</h1>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
          <span className="rounded-full bg-tb-surface-2 px-2.5 py-0.5 text-xs font-medium text-tb-muted">
            {t(`sala.mode.${data.mode}`)}
          </span>
          {(() => {
            const variant = (data.options as { variant?: string } | null)?.variant;
            return variant ? (
              <span className="rounded-full bg-tb-surface-2 px-2.5 py-0.5 text-xs font-medium text-tb-muted">
                {t(`sala.variant.${variant}`)}
              </span>
            ) : null;
          })()}
        </div>

        {joinError && <p className="mt-3 text-xs font-medium text-tb-danger">{joinError}</p>}

        {connectionStatus !== 'open' && (
          <p className="mt-3 text-xs font-medium text-tb-warn">{t(`sala.connection.${connectionStatus}`)}</p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {Array.from({ length: lobby?.maxPlayers ?? 2 }, (_, seat) => {
            const s = seats.find((x) => x.seat === seat);
            return (
              <div key={seat} className="flex items-center justify-between rounded-xl bg-tb-surface-2 px-4 py-3">
                <span className="flex items-center gap-2.5 text-sm font-medium text-tb-text">
                  {s?.username && s.userId ? (
                    <UserHoverCard userId={s.userId}>
                      <Avatar
                        initial={s.avatarInitial ?? s.username.charAt(0).toUpperCase()}
                        color={s.avatarColor ?? '#2f6fe0'}
                        size={32}
                      />
                    </UserHoverCard>
                  ) : (
                    <UsersIcon className="h-4 w-4 text-tb-muted" />
                  )}
                  {s?.username ?? t('sala.emptySeat')}
                </span>
                {s && (
                  <span
                    className={`tb-nums rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      s.ready ? 'bg-tb-success/15 text-tb-success' : 'bg-tb-border text-tb-muted'
                    }`}
                  >
                    {s.ready ? t('sala.ready') : t('sala.notReady')}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {leaveError && <p className="mt-3 text-xs font-medium text-tb-danger">{leaveError}</p>}

        {mySeat && (
          <button
            type="button"
            onClick={toggleReady}
            disabled={setReady.isPending}
            className="tb-gradient-cta mt-6 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {mySeat.ready ? t('sala.cancelReady') : t('sala.markReady')}
          </button>
        )}

        {mySeat && lobby?.state === 'waiting' && (
          <button
            type="button"
            onClick={handleLeave}
            disabled={leaveMatch.isPending}
            className="mt-3 w-full rounded-lg border border-tb-border px-4 py-2 text-sm font-medium text-tb-muted transition-colors hover:border-tb-danger hover:text-tb-danger disabled:opacity-50"
          >
            {t('sala.leave')}
          </button>
        )}
      </div>
    </section>
  );
}
