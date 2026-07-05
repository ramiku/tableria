import { useEffect, useState, type ReactNode } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import {
  ArrowLeftIcon,
  BookIcon,
  CardsIcon,
  CheckIcon,
  ClockIcon,
  DiceIcon,
  DoorIcon,
  LinkIcon,
  PlayIcon,
  PlusIcon,
  UsersIcon,
} from '../components/icons';
import { formatDuration } from '../lib/formatDuration';
import { trpc } from '../lib/trpc';
import { matchSocket } from '../lib/ws';
import { useMatchStore } from '../stores/match';

export const Route = createFileRoute('/_app/juegos/$slug')({ component: GamePage });

const FALLBACK_COVER = '#2f6fe0';
const REALTIME_PRESETS = [15, 30, 60, 120, 300];
const ASYNC_PRESETS = [21600, 43200, 86400, 172800, 259200, 604800];

function CategoryIcon({ categorySlug, className }: { categorySlug: string | null; className?: string }) {
  if (categorySlug === 'cartas') return <CardsIcon className={className} />;
  return <DiceIcon className={className} />;
}

function playerRange(min: number, max: number): string {
  return min === max ? String(min) : `${min}-${max}`;
}

// ---------------------------------------------------------------------------
// Asientos: el elemento firma del lobby. Ocupado = avatar real con nombre;
// libre = círculo discontinuo con "+" que, cuando la mesa es de otro, es
// literalmente el botón de unirse.
// ---------------------------------------------------------------------------

interface SeatUser {
  username: string;
  avatarInitial: string | null;
  avatarColor: string | null;
  ready?: boolean;
}

function OccupiedSeat({ user, size = 56 }: { user: SeatUser; size?: number }) {
  return (
    <div className="flex w-20 flex-col items-center gap-1.5">
      <span className="relative inline-flex">
        <Avatar
          initial={user.avatarInitial ?? user.username.charAt(0).toUpperCase()}
          color={user.avatarColor ?? FALLBACK_COVER}
          size={size}
        />
        {user.ready && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-tb-success text-white ring-2 ring-tb-surface">
            <CheckIcon className="h-3 w-3" />
          </span>
        )}
      </span>
      <p className="w-full truncate text-center text-xs font-semibold text-tb-text">{user.username}</p>
    </div>
  );
}

function EmptySeat({
  label,
  onJoin,
  joining,
  size = 56,
}: {
  label: string;
  onJoin?: () => void;
  joining?: boolean;
  size?: number;
}) {
  const circle = (
    <span
      className={`flex items-center justify-center rounded-full border-2 border-dashed text-tb-muted transition-colors motion-safe:animate-pulse ${
        onJoin ? 'border-tb-accent text-tb-accent group-hover:bg-tb-accent-tint group-hover:motion-safe:animate-none' : 'border-tb-border'
      }`}
      style={{ width: size, height: size }}
    >
      <PlusIcon />
    </span>
  );

  if (!onJoin) {
    return (
      <div className="flex w-20 flex-col items-center gap-1.5">
        {circle}
        <p className="text-center text-xs text-tb-muted">{label}</p>
      </div>
    );
  }

  return (
    <button type="button" onClick={onJoin} disabled={joining} className="group flex w-20 flex-col items-center gap-1.5 disabled:opacity-50">
      {circle}
      <p className="text-center text-xs font-semibold text-tb-accent">{label}</p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Config: tarjetas de modo + chips de ritmo/variante
// ---------------------------------------------------------------------------

function Eyebrow({ children }: { children: string }) {
  return <p className="text-xs font-bold uppercase tracking-wide text-tb-muted">{children}</p>;
}

function ModeCard({
  selected,
  onSelect,
  icon,
  title,
  desc,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors ${
        selected ? 'border-tb-accent bg-tb-accent-tint ring-1 ring-tb-accent' : 'border-tb-border bg-tb-surface hover:border-tb-accent'
      }`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${selected ? 'bg-tb-accent text-tb-accent-fg' : 'bg-tb-surface-2 text-tb-muted'}`}>
        {icon}
      </span>
      <span className="font-display text-sm font-bold text-tb-text">{title}</span>
      <span className="text-xs leading-relaxed text-tb-muted">{desc}</span>
    </button>
  );
}

function Chip({ selected, onSelect, children }: { selected: boolean; onSelect: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`tb-nums rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        selected ? 'bg-tb-accent text-tb-accent-fg' : 'border border-tb-border text-tb-muted hover:border-tb-accent hover:text-tb-accent'
      }`}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tu mesa: asientos en vivo por WS + confirmación de arranque
// ---------------------------------------------------------------------------

function MyTablePanel({ matchId, code, meId }: { matchId: string; code: string; meId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [copied, setCopied] = useState(false);

  const lobby = useMatchStore((s) => s.lobby);
  const matchState = useMatchStore((s) => s.matchState);
  const connectionStatus = useMatchStore((s) => s.connectionStatus);

  const setReady = trpc.matches.setReady.useMutation();
  const leaveMatch = trpc.matches.leave.useMutation({
    onSuccess: () => {
      useMatchStore.getState().reset();
      void utils.matches.myActive.invalidate();
      void utils.matches.listWaiting.invalidate();
    },
  });

  useEffect(() => {
    matchSocket.subscribe({ type: 'match.join', payload: { matchId } });
    return () => useMatchStore.getState().reset();
  }, [matchId]);

  useEffect(() => {
    if (matchState) void navigate({ to: '/partida/$id', params: { id: matchId } });
  }, [matchState, matchId, navigate]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: nada más que hacer.
    }
  }

  const seats = lobby?.seats ?? [];
  const maxPlayers = lobby?.maxPlayers ?? 2;
  const full = seats.length > 0 && seats.every((s) => s.userId !== null);
  const mySeat = seats.find((s) => s.userId === meId);
  const othersPending = seats.filter((s) => s.userId && s.userId !== meId && !s.ready);

  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-tb-border bg-tb-surface p-8 text-center">
        <Eyebrow>{t('lobby.yourTable')}</Eyebrow>
        <button
          type="button"
          onClick={handleCopy}
          data-testid="room-code"
          className="tb-nums mx-auto mt-3 flex items-center gap-2 rounded-lg border border-tb-border bg-tb-surface-2 px-4 py-2 font-display text-2xl font-extrabold tracking-widest text-tb-text"
        >
          {code}
          {copied ? <CheckIcon className="h-5 w-5 text-tb-success" /> : <LinkIcon className="h-5 w-5 text-tb-muted" />}
        </button>

        {connectionStatus !== 'open' && (
          <p className="mt-3 text-xs font-medium text-tb-warn">{t(`sala.connection.${connectionStatus}`)}</p>
        )}

        <div className="mt-8 flex flex-wrap items-start justify-center gap-8">
          {Array.from({ length: maxPlayers }, (_, i) => {
            const seat = seats.find((s) => s.seat === i);
            return seat?.userId ? (
              <OccupiedSeat
                key={i}
                size={64}
                user={{
                  username: seat.username ?? '?',
                  avatarInitial: seat.avatarInitial,
                  avatarColor: seat.avatarColor,
                  ready: seat.ready,
                }}
              />
            ) : (
              <EmptySeat key={i} size={64} label={t('lobby.available')} />
            );
          })}
        </div>

        <div className="mt-8">
          {!full && <p className="text-sm text-tb-muted">{t('lobby.waitingRival')}</p>}

          {full && !mySeat?.ready && (
            <>
              <p className="font-display text-lg font-bold text-tb-text">{t('lobby.readyPrompt')}</p>
              <button
                type="button"
                onClick={() => setReady.mutate({ matchId, ready: true })}
                disabled={setReady.isPending}
                className="tb-gradient-cta mt-4 w-full rounded-xl px-6 py-3.5 font-display text-base font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {t('lobby.startNow')}
              </button>
            </>
          )}

          {full && mySeat?.ready && othersPending.length > 0 && (
            <>
              <p className="text-sm font-medium text-tb-text">
                {t('lobby.waitingFor', { name: othersPending.map((s) => s.username).join(', ') })}
              </p>
              <button
                type="button"
                onClick={() => setReady.mutate({ matchId, ready: false })}
                disabled={setReady.isPending}
                className="mt-3 text-xs font-semibold text-tb-muted hover:text-tb-danger"
              >
                {t('lobby.cancelReady')}
              </button>
            </>
          )}
        </div>

        {lobby?.state === 'waiting' && (
          <button
            type="button"
            onClick={() => leaveMatch.mutate({ matchId })}
            disabled={leaveMatch.isPending}
            className="mt-6 w-full rounded-lg border border-tb-border px-4 py-2 text-sm font-medium text-tb-muted transition-colors hover:border-tb-danger hover:text-tb-danger disabled:opacity-50"
          >
            {t('lobby.leave')}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mesas públicas esperando jugadores: unirse pulsando el asiento libre
// ---------------------------------------------------------------------------

function WaitingTables({ gameId, canJoin }: { gameId: string; canJoin: boolean }) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data } = trpc.matches.listWaiting.useQuery({ gameId }, { refetchInterval: 4000 });
  const [joinError, setJoinError] = useState('');

  const joinMatch = trpc.matches.join.useMutation({
    onSuccess: () => {
      setJoinError('');
      void utils.matches.myActive.invalidate();
    },
    onError: (err) => setJoinError(err.message),
  });

  return (
    <section>
      <div className="flex items-center gap-2">
        <Eyebrow>{t('lobby.waitingTables')}</Eyebrow>
        {data && data.length > 0 && (
          <span className="tb-nums rounded-full bg-tb-accent-tint px-2 py-0.5 text-xs font-bold text-tb-accent">{data.length}</span>
        )}
      </div>

      {joinError && <p className="mt-2 text-sm font-medium text-tb-danger">{joinError}</p>}

      {!data || data.length === 0 ? (
        <p className="mt-3 text-sm text-tb-muted">{t('lobby.noTables')}</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {data.map((table) => (
            <div key={table.matchId} className="rounded-2xl border border-tb-border bg-tb-surface p-4">
              <div className="flex flex-wrap items-start justify-center gap-5">
                {Array.from({ length: table.maxPlayers }, (_, i) => {
                  const seat = table.seats.find((s) => s.seat === i);
                  return seat ? (
                    <OccupiedSeat key={i} size={44} user={seat} />
                  ) : (
                    <EmptySeat
                      key={i}
                      size={44}
                      label={t('lobby.join')}
                      onJoin={canJoin ? () => joinMatch.mutate({ code: table.code }) : undefined}
                      joining={joinMatch.isPending}
                    />
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                <span className="rounded-full bg-tb-surface-2 px-2.5 py-0.5 text-xs font-medium text-tb-muted">
                  {t(`sala.mode.${table.mode}`)}
                </span>
                {table.turnDurationS != null && (
                  <span className="tb-nums rounded-full bg-tb-surface-2 px-2.5 py-0.5 text-xs font-medium text-tb-muted">
                    <ClockIcon className="mr-1 inline h-3 w-3" />
                    {formatDuration(table.turnDurationS)}
                  </span>
                )}
                {table.variant && (
                  <span className="rounded-full bg-tb-surface-2 px-2.5 py-0.5 text-xs font-medium text-tb-muted">
                    {t(`sala.variant.${table.variant}`)}
                  </span>
                )}
                {table.rated && (
                  <span className="rounded-full bg-tb-accent-tint px-2.5 py-0.5 text-xs font-medium text-tb-accent">
                    {t('lobby.ratedBadge')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Lobby completo del tab "Jugar"
// ---------------------------------------------------------------------------

interface GameLobbyProps {
  gameId: string;
  minPlayers: number;
  maxPlayers: number;
  variants: { id: string; name: string }[];
  defaultTurnSeconds: number;
  me: { id: string; username: string; avatarInitial: string | null; avatarColor: string | null };
}

function GameLobby({ gameId, minPlayers, maxPlayers, variants, defaultTurnSeconds, me }: GameLobbyProps) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<'realtime' | 'async'>('realtime');
  const [turnDurationS, setTurnDurationS] = useState(defaultTurnSeconds);
  const [variant, setVariant] = useState(variants[0]?.id ?? '');
  const [isPrivate, setIsPrivate] = useState(false);
  const [rated, setRated] = useState(false);
  // Aforo variable (p.ej. Pista Única, 3-8): el anfitrión elige cuántos asientos tiene la mesa.
  // En juegos de aforo fijo (minPlayers === maxPlayers) no se muestra selector y esto no varía.
  const [seatCount, setSeatCount] = useState(minPlayers);
  const variableSeats = minPlayers !== maxPlayers;

  const { data: myActive, isLoading } = trpc.matches.myActive.useQuery();
  const createMatch = trpc.matches.create.useMutation({
    onSuccess: () => void utils.matches.myActive.invalidate(),
  });

  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-2xl border border-tb-border bg-tb-surface-2" />;
  }

  // Sentado en una mesa de ESTE juego → la pantalla es la mesa.
  if (myActive && myActive.gameId === gameId && (myActive.state === 'waiting' || myActive.state === 'starting')) {
    return <MyTablePanel matchId={myActive.matchId} code={myActive.code} meId={me.id} />;
  }

  // Partida en curso de este juego → reanudar.
  if (myActive && myActive.gameId === gameId && myActive.state === 'in_game') {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-tb-border bg-tb-surface p-8 text-center">
        <p className="font-display text-lg font-bold text-tb-text">{t('lobby.inGame')}</p>
        <Link
          to="/partida/$id"
          params={{ id: myActive.matchId }}
          className="tb-gradient-cta mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-display text-base font-extrabold text-white transition-opacity hover:opacity-90"
        >
          <PlayIcon className="h-4 w-4" />
          {t('lobby.resume')}
        </Link>
      </div>
    );
  }

  // Sentado en una mesa de OTRO juego → aviso + solo mirar.
  const blockedByOtherTable = !!myActive;

  const presets = mode === 'realtime' ? REALTIME_PRESETS : ASYNC_PRESETS;

  function handleModeChange(next: 'realtime' | 'async') {
    setMode(next);
    setTurnDurationS(next === 'realtime' ? defaultTurnSeconds : ASYNC_PRESETS[2]!);
  }

  return (
    <div className="flex flex-col gap-8">
      {blockedByOtherTable ? (
        <div className="rounded-2xl border border-tb-border bg-tb-surface p-6 text-center">
          <p className="text-sm text-tb-muted">{t('lobby.otherTable')}</p>
          <Link
            to="/sala/$code"
            params={{ code: myActive!.code }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-tb-border px-3.5 py-2 text-sm font-semibold text-tb-text hover:border-tb-accent hover:text-tb-accent"
          >
            <DoorIcon className="h-4 w-4" />
            {t('lobby.goToTable')}
          </Link>
        </div>
      ) : (
        // Las mesas en espera van ANTES de la config: quien entra a la ficha debe
        // descubrir de un vistazo que hay alguien esperando rival.
        <WaitingTables gameId={gameId} canJoin />
      )}

      {!blockedByOtherTable && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          {/* Configuración */}
          <div className="flex flex-col gap-6 rounded-2xl border border-tb-border bg-tb-surface p-6">
            <div>
              <Eyebrow>{t('lobby.mode')}</Eyebrow>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <ModeCard
                  selected={mode === 'realtime'}
                  onSelect={() => handleModeChange('realtime')}
                  icon={<PlayIcon className="h-4 w-4" />}
                  title={t('lobby.realtime.title')}
                  desc={t('lobby.realtime.desc')}
                />
                <ModeCard
                  selected={mode === 'async'}
                  onSelect={() => handleModeChange('async')}
                  icon={<ClockIcon className="h-4 w-4" />}
                  title={t('lobby.async.title')}
                  desc={t('lobby.async.desc')}
                />
              </div>
            </div>

            <div>
              <Eyebrow>{t('lobby.speed')}</Eyebrow>
              <div className="mt-2 flex flex-wrap gap-2">
                {presets.map((s) => (
                  <Chip key={s} selected={turnDurationS === s} onSelect={() => setTurnDurationS(s)}>
                    {formatDuration(s)}
                  </Chip>
                ))}
              </div>
            </div>

            {variants.length > 1 && (
              <div>
                <Eyebrow>{t('lobby.variant')}</Eyebrow>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <Chip key={v.id} selected={variant === v.id} onSelect={() => setVariant(v.id)}>
                      {v.name}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {variableSeats && (
              <div>
                <Eyebrow>{t('lobby.seatCount')}</Eyebrow>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.from({ length: maxPlayers - minPlayers + 1 }, (_, i) => minPlayers + i).map((n) => (
                    <Chip key={n} selected={seatCount === n} onSelect={() => setSeatCount(n)}>
                      {String(n)}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-tb-border bg-tb-surface-2 px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-tb-text">{t('lobby.private')}</span>
                <span className="block text-xs text-tb-muted">{t('lobby.privateHint')}</span>
              </span>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="h-4 w-4 shrink-0 accent-tb-accent"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-tb-border bg-tb-surface-2 px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-tb-text">{t('lobby.rated')}</span>
                <span className="block text-xs text-tb-muted">{t('lobby.ratedHint')}</span>
              </span>
              <input
                type="checkbox"
                checked={rated}
                onChange={(e) => setRated(e.target.checked)}
                className="h-4 w-4 shrink-0 accent-tb-accent"
              />
            </label>
          </div>

          {/* Tu mesa (previa) + Comenzar */}
          <div className="flex flex-col rounded-2xl border border-tb-border bg-tb-surface p-6">
            <Eyebrow>{t('lobby.yourTable')}</Eyebrow>
            <div className="mt-4 flex flex-wrap items-start justify-center gap-6">
              <OccupiedSeat user={{ username: me.username, avatarInitial: me.avatarInitial, avatarColor: me.avatarColor }} />
              {Array.from({ length: seatCount - 1 }, (_, i) => (
                <EmptySeat key={i} label={t('lobby.available')} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
              <span className="rounded-full bg-tb-surface-2 px-2.5 py-0.5 text-xs font-medium text-tb-muted">
                {t(`sala.mode.${mode}`)}
              </span>
              <span className="tb-nums rounded-full bg-tb-surface-2 px-2.5 py-0.5 text-xs font-medium text-tb-muted">
                {formatDuration(turnDurationS)}
              </span>
              {variants.length > 1 && (
                <span className="rounded-full bg-tb-surface-2 px-2.5 py-0.5 text-xs font-medium text-tb-muted">
                  {variants.find((v) => v.id === variant)?.name}
                </span>
              )}
              <span className="rounded-full bg-tb-surface-2 px-2.5 py-0.5 text-xs font-medium text-tb-muted">
                {isPrivate ? t('lobby.privateBadge') : t('lobby.publicBadge')}
              </span>
              <span className="rounded-full bg-tb-surface-2 px-2.5 py-0.5 text-xs font-medium text-tb-muted">
                {rated ? t('lobby.ratedBadge') : t('lobby.casualBadge')}
              </span>
            </div>
            {createMatch.isError && <p className="mt-3 text-center text-xs text-tb-danger">{createMatch.error.message}</p>}
            <button
              type="button"
              onClick={() =>
                createMatch.mutate({
                  gameId,
                  isPrivate,
                  mode,
                  turnDurationS,
                  variant: variants.length > 1 ? variant : undefined,
                  rated,
                  numPlayers: variableSeats ? seatCount : undefined,
                })
              }
              disabled={createMatch.isPending}
              className="tb-gradient-cta mt-5 w-full rounded-xl px-6 py-3.5 font-display text-base font-extrabold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {createMatch.isPending ? t('lobby.creating') : t('lobby.start')}
            </button>
          </div>
        </div>
      )}

      {blockedByOtherTable && <WaitingTables gameId={gameId} canJoin={false} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página del juego
// ---------------------------------------------------------------------------

function GamePage() {
  const { t } = useTranslation();
  const { slug } = Route.useParams();
  const { me } = Route.useRouteContext();
  const { data, isLoading } = trpc.games.bySlug.useQuery({ slug });
  const [tab, setTab] = useState<'jugar' | 'reglas'>('jugar');

  if (isLoading) {
    return (
      <section>
        <div className="h-48 animate-pulse rounded-2xl border border-tb-border bg-tb-surface-2" />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tb-surface-2 text-tb-muted">
          <DiceIcon className="h-6 w-6" />
        </span>
        <h1 className="font-display text-xl font-bold">{t('game.notFound')}</h1>
        <p className="max-w-sm text-sm text-tb-muted">{t('game.notFoundBody')}</p>
        <Link
          to="/"
          className="mt-2 flex items-center gap-1.5 rounded-lg border border-tb-border px-3.5 py-2 text-sm font-medium text-tb-text hover:bg-tb-surface-2"
        >
          <ArrowLeftIcon />
          {t('game.backToCatalog')}
        </Link>
      </section>
    );
  }

  const { game, rules, variants, defaultTurnSeconds } = data;
  const cover = game.coverBg ?? FALLBACK_COVER;

  return (
    <section>
      <Link
        to="/"
        className="mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-tb-muted transition-colors hover:text-tb-text"
      >
        <ArrowLeftIcon />
        {t('game.backToCatalog')}
      </Link>

      {/* Hero: misma técnica de gradiente + motivo de categoría que la GameCard, a mayor escala */}
      <div
        className="relative overflow-hidden rounded-2xl p-8"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${cover} 100%, white 12%) 0%, ${cover} 55%, color-mix(in srgb, ${cover} 100%, black 25%) 100%)`,
        }}
      >
        <CategoryIcon
          categorySlug={game.categorySlug}
          className="pointer-events-none absolute -bottom-8 -right-6 h-40 w-40 rotate-[-12deg] text-white/10"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            {game.badge && (
              <span className="mb-2 inline-block rounded-md bg-black/30 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                {game.badge}
              </span>
            )}
            <h1 className="font-display text-3xl font-extrabold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
              {game.name}
            </h1>
            {game.description && <p className="mt-2 max-w-md text-sm text-white/85">{game.description}</p>}
          </div>
          <span
            className={`tb-nums flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${game.isActive ? 'bg-tb-success' : 'bg-white/60'}`} />
            {game.isActive ? t('game.status.available') : t('game.status.comingSoon')}
          </span>
        </div>

        <div className="relative mt-6 flex flex-wrap gap-5 text-sm text-white/90">
          <span className="flex items-center gap-1.5">
            <UsersIcon className="h-4 w-4" />
            {playerRange(game.minPlayers, game.maxPlayers)} {t('game.meta.players')}
          </span>
          {game.durationMin != null && (
            <span className="flex items-center gap-1.5">
              <ClockIcon className="h-4 w-4" />
              {t('game.durationMin', { count: game.durationMin })}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CategoryIcon categorySlug={game.categorySlug} className="h-4 w-4" />
            {game.categoryName}
          </span>
        </div>
      </div>

      {/* Tabs Jugar / Reglas */}
      <div className="mt-6 flex gap-1 rounded-lg border border-tb-border bg-tb-surface-2 p-1 sm:w-fit">
        <button
          type="button"
          onClick={() => setTab('jugar')}
          aria-pressed={tab === 'jugar'}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
            tab === 'jugar' ? 'bg-tb-accent text-tb-accent-fg' : 'text-tb-muted hover:text-tb-text'
          }`}
        >
          <PlayIcon className="h-4 w-4" />
          {t('game.tabs.play')}
        </button>
        <button
          type="button"
          onClick={() => setTab('reglas')}
          aria-pressed={tab === 'reglas'}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
            tab === 'reglas' ? 'bg-tb-accent text-tb-accent-fg' : 'text-tb-muted hover:text-tb-text'
          }`}
        >
          <BookIcon className="h-4 w-4" />
          {t('game.tabs.rules')}
        </button>
      </div>

      {tab === 'jugar' ? (
        <div className="mt-4">
          {game.isActive ? (
            <GameLobby
              gameId={game.slug}
              minPlayers={game.minPlayers}
              maxPlayers={game.maxPlayers}
              variants={variants}
              defaultTurnSeconds={defaultTurnSeconds}
              me={me}
            />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-tb-border bg-tb-surface p-6">
              <p className="text-sm text-tb-muted">
                {t('game.play.availability', { milestone: t('game.milestoneM2') })}
              </p>
              <button
                type="button"
                disabled
                className="tb-gradient-cta flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white opacity-50"
              >
                <PlayIcon className="h-4 w-4" />
                {t('lobby.start')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-tb-border bg-tb-surface p-6">
          {rules ? (
            <p className="max-w-2xl text-[15px] leading-relaxed text-tb-text">{rules}</p>
          ) : (
            <p className="text-sm text-tb-muted">{t('game.rules.empty')}</p>
          )}
        </div>
      )}
    </section>
  );
}
