import { useState, type FormEvent } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { DoorIcon, UsersIcon } from '../components/icons';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/salas')({ component: RoomsPage });

/** Un circulito por asiento: relleno = ocupado, hueco = libre para que se una alguien más. */
function SeatDots({ occupied, max }: { occupied: number; max: number }) {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${i < occupied ? 'bg-tb-accent' : 'border border-tb-border bg-transparent'}`}
        />
      ))}
    </span>
  );
}

function JoinByCode() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const joinMatch = trpc.matches.join.useMutation({
    onSuccess: () => void navigate({ to: '/sala/$code', params: { code: code.trim().toUpperCase() } }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    joinMatch.mutate({ code: trimmed });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder={t('rooms.codePlaceholder')}
        className="tb-nums w-40 rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-2 text-sm uppercase tracking-widest text-tb-text placeholder:normal-case placeholder:tracking-normal placeholder:text-tb-muted"
      />
      <button
        type="submit"
        disabled={joinMatch.isPending}
        className="tb-gradient-cta rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {t('rooms.join')}
      </button>
      {joinMatch.isError && <p className="text-xs text-tb-danger">{t('rooms.joinError')}</p>}
    </form>
  );
}

function RoomsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = trpc.matches.listPublic.useQuery(undefined, { refetchInterval: 5000 });

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold">{t('rooms.title')}</h1>
        <JoinByCode />
      </header>

      <div className="mt-6">
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-tb-border bg-tb-surface-2" />
            ))}
          </div>
        )}

        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="mt-8 text-sm text-tb-muted">{t('rooms.empty')}</p>
        )}

        {!isLoading && (data?.length ?? 0) > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data!.map((room) => (
              <div
                key={room.matchId}
                className="flex items-center justify-between rounded-2xl border border-tb-border bg-tb-surface p-4"
              >
                <div>
                  <p className="font-display text-sm font-bold text-tb-text">{room.gameName}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <SeatDots occupied={room.players} max={room.maxPlayers} />
                    <p className="flex items-center gap-1.5 text-xs text-tb-muted">
                      <UsersIcon className="h-3.5 w-3.5" />
                      {t('rooms.playersCount', { count: room.players, max: room.maxPlayers })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void navigate({ to: '/sala/$code', params: { code: room.code } })}
                  className="flex items-center gap-1.5 rounded-lg border border-tb-border px-3 py-1.5 text-sm font-medium text-tb-text hover:bg-tb-surface-2"
                >
                  <DoorIcon className="h-4 w-4" />
                  {t('rooms.enter')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
