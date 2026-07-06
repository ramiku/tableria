import { useMemo } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { DoorIcon, UsersIcon } from '../components/icons';
import { trpc } from '../lib/trpc';

interface PublicRoom {
  matchId: string;
  code: string;
  gameId: string;
  gameName: string;
  maxPlayers: number;
  rated: boolean;
  players: number;
}

/** Agrupa preservando el orden de llegada (ya viene ordenado por más reciente primero),
 * así el juego con la mesa más nueva encabeza la lista. */
function groupByGame(rooms: PublicRoom[]): { gameId: string; gameName: string; rooms: PublicRoom[] }[] {
  const groups = new Map<string, { gameId: string; gameName: string; rooms: PublicRoom[] }>();
  for (const room of rooms) {
    let group = groups.get(room.gameId);
    if (!group) {
      group = { gameId: room.gameId, gameName: room.gameName, rooms: [] };
      groups.set(room.gameId, group);
    }
    group.rooms.push(room);
  }
  return Array.from(groups.values());
}

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

function RoomsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = trpc.matches.listPublic.useQuery(undefined, { refetchInterval: 5000 });
  const groups = useMemo(() => groupByGame(data ?? []), [data]);

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold">{t('rooms.title')}</h1>
      </header>

      <div className="mt-6 flex flex-col gap-8">
        {isLoading && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-tb-border bg-tb-surface-2" />
            ))}
          </div>
        )}

        {!isLoading && groups.length === 0 && <p className="mt-2 text-sm text-tb-muted">{t('rooms.empty')}</p>}

        {!isLoading &&
          groups.map((group) => (
            <div key={group.gameId}>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-tb-muted">{group.gameName}</h2>
                <span className="tb-nums rounded-full bg-tb-accent-tint px-2 py-0.5 text-xs font-bold text-tb-accent">
                  {group.rooms.length}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {group.rooms.map((room) => (
                  <div
                    key={room.matchId}
                    className="flex items-center justify-between rounded-2xl border border-tb-border bg-tb-surface p-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <SeatDots occupied={room.players} max={room.maxPlayers} />
                        <p className="flex items-center gap-1.5 text-xs text-tb-muted">
                          <UsersIcon className="h-3.5 w-3.5" />
                          {t('rooms.playersCount', { count: room.players, max: room.maxPlayers })}
                        </p>
                      </div>
                      <span
                        className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          room.rated ? 'bg-tb-accent-tint text-tb-accent' : 'bg-tb-surface-2 text-tb-muted'
                        }`}
                      >
                        {t(room.rated ? 'lobby.ratedBadge' : 'lobby.casualBadge')}
                      </span>
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
            </div>
          ))}
      </div>
    </section>
  );
}
