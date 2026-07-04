import { useEffect, useState } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { CheckIcon, LinkIcon, UsersIcon } from '../components/icons';
import { useCountdownSeconds } from '../lib/useCountdown';
import { trpc } from '../lib/trpc';
import { matchSocket } from '../lib/ws';
import { useMatchStore } from '../stores/match';

export const Route = createFileRoute('/_app/sala/$code')({ component: RoomPage });

function RoomPage() {
  const { t } = useTranslation();
  const { code } = Route.useParams();
  const { me } = Route.useRouteContext();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = trpc.matches.getByCode.useQuery({ code });
  const lobby = useMatchStore((s) => s.lobby);
  const matchState = useMatchStore((s) => s.matchState);
  const connectionStatus = useMatchStore((s) => s.connectionStatus);
  const setReady = trpc.matches.setReady.useMutation();
  const countdown = useCountdownSeconds(lobby?.startsAt ?? null);

  const matchId = data?.matchId ?? null;

  useEffect(() => {
    if (!matchId) return;
    matchSocket.subscribe({ type: 'match.join', payload: { matchId } });
    return () => useMatchStore.getState().reset();
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    if (data?.state === 'in_game' || matchState) {
      void navigate({ to: '/partida/$id', params: { id: matchId } });
    }
  }, [data?.state, matchState, matchId, navigate]);

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

  if (data.state === 'finished' || data.state === 'cancelled' || data.state === 'abandoned') {
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

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: no hay nada más que hacer aquí.
    }
  }

  function toggleReady() {
    if (!matchId || !mySeat) return;
    setReady.mutate({ matchId, ready: !mySeat.ready });
  }

  return (
    <section className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-tb-border bg-tb-surface p-6 text-center">
        <p className="text-sm text-tb-muted">{t('sala.title')}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="tb-nums mx-auto mt-2 flex items-center gap-2 rounded-lg border border-tb-border bg-tb-surface-2 px-4 py-2 font-display text-2xl font-extrabold tracking-widest text-tb-text"
        >
          {code}
          {copied ? <CheckIcon className="h-5 w-5 text-tb-success" /> : <LinkIcon className="h-5 w-5 text-tb-muted" />}
        </button>

        {connectionStatus !== 'open' && (
          <p className="mt-3 text-xs font-medium text-tb-warn">{t(`sala.connection.${connectionStatus}`)}</p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {Array.from({ length: lobby?.maxPlayers ?? 2 }, (_, seat) => {
            const s = seats.find((x) => x.seat === seat);
            return (
              <div key={seat} className="flex items-center justify-between rounded-xl bg-tb-surface-2 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-medium text-tb-text">
                  <UsersIcon className="h-4 w-4 text-tb-muted" />
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

        {lobby?.state === 'starting' && countdown !== null && (
          <p className="tb-nums mt-5 font-display text-lg font-bold text-tb-accent">
            {t('sala.startingIn', { count: countdown })}
          </p>
        )}

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
      </div>
    </section>
  );
}
