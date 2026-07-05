import { Link, createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '@tableria/server';
import { Avatar } from '../components/Avatar';
import { ArrowLeftIcon, CheckIcon, TrophyIcon } from '../components/icons';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/torneos/$id')({ component: TournamentDetailPage });

type TournamentDetail = NonNullable<inferRouterOutputs<AppRouter>['tournaments']['getById']>;
type TournamentRound = TournamentDetail['rounds'][number];
type TournamentMatch = TournamentRound['matches'][number];
type TournamentParticipant = TournamentDetail['participants'][number];

function RegistrationPanel({
  participants,
  myParticipant,
  onRegister,
  onUnregister,
  onToggleCheckIn,
}: {
  participants: TournamentParticipant[];
  myParticipant: TournamentParticipant | undefined;
  onRegister: () => void;
  onUnregister: () => void;
  onToggleCheckIn: (checkedIn: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <article className="rounded-2xl border border-tb-border bg-tb-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold text-tb-text">
          {t('tournaments.participants', { count: participants.length })}
        </h2>
        {!myParticipant ? (
          <button
            type="button"
            onClick={onRegister}
            className="tb-gradient-cta rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t('tournaments.register')}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onUnregister}
              className="rounded-lg border border-tb-border px-3 py-1.5 text-xs font-semibold text-tb-muted hover:border-tb-danger hover:text-tb-danger"
            >
              {t('tournaments.unregister')}
            </button>
            <button
              type="button"
              onClick={() => onToggleCheckIn(myParticipant.status !== 'checked_in')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                myParticipant.status === 'checked_in' ? 'bg-tb-success/15 text-tb-success' : 'tb-gradient-cta text-white'
              }`}
            >
              {myParticipant.status === 'checked_in' ? t('tournaments.checkedIn') : t('tournaments.checkIn')}
            </button>
          </div>
        )}
      </div>
      <ul className="mt-4 flex flex-col divide-y divide-tb-border">
        {participants.length === 0 && <p className="py-3 text-sm text-tb-muted">{t('tournaments.noParticipants')}</p>}
        {participants.map((p) => (
          <li key={p.userId} className="flex items-center gap-3 py-2.5">
            <Avatar initial={p.avatarInitial ?? p.username.charAt(0).toUpperCase()} color={p.avatarColor ?? '#2f6fe0'} size={32} />
            <span className="flex-1 truncate text-sm font-medium text-tb-text">{p.username}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                p.status === 'checked_in' ? 'bg-tb-success/15 text-tb-success' : 'bg-tb-surface-2 text-tb-muted'
              }`}
            >
              {t(`tournaments.participantStatus.${p.status}`)}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function PlayerRow({ participant, isWinner }: { participant: TournamentMatch['participantA']; isWinner: boolean }) {
  const { t } = useTranslation();
  if (!participant) return <p className="text-sm text-tb-muted">{t('tournaments.tbd')}</p>;
  return (
    <div className={`flex items-center gap-2 py-0.5 ${isWinner ? 'font-semibold text-tb-text' : 'text-tb-muted'}`}>
      <Avatar
        initial={participant.avatarInitial ?? participant.username.charAt(0).toUpperCase()}
        color={participant.avatarColor ?? '#2f6fe0'}
        size={20}
      />
      <span className="truncate text-sm">{participant.username}</span>
      {isWinner && <CheckIcon className="h-3 w-3 shrink-0 text-tb-success" />}
    </div>
  );
}

function MatchCard({ match, meId }: { match: TournamentMatch; meId: string }) {
  const { t } = useTranslation();
  const isBye = !match.participantBId;
  const involvesMe = match.participantAId === meId || match.participantBId === meId;

  return (
    <div
      className={`rounded-xl border p-3 ${
        match.state === 'finished' ? 'border-tb-border bg-tb-surface-2' : 'border-tb-accent bg-tb-accent-tint'
      }`}
    >
      <PlayerRow participant={match.participantA} isWinner={!!match.winnerUserId && match.winnerUserId === match.participantAId} />
      {!isBye ? (
        <PlayerRow participant={match.participantB} isWinner={!!match.winnerUserId && match.winnerUserId === match.participantBId} />
      ) : (
        <p className="mt-1 text-xs text-tb-muted">{t('tournaments.bye')}</p>
      )}
      {match.matchId && match.state === 'pending' && (
        <Link
          to="/partida/$id"
          params={{ id: match.matchId }}
          className={`mt-2 inline-block text-xs font-semibold ${involvesMe ? 'text-tb-accent hover:text-tb-accent-strong' : 'text-tb-muted hover:text-tb-text'}`}
        >
          {involvesMe ? t('tournaments.goToMatch') : t('tournaments.spectate')}
        </Link>
      )}
    </div>
  );
}

function Bracket({ rounds, meId }: { rounds: TournamentRound[]; meId: string }) {
  const { t } = useTranslation();
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2">
      <div className="flex gap-6" style={{ minWidth: 'max-content' }}>
        {rounds.map((round) => (
          <div key={round.id} className="flex w-56 shrink-0 flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('tournaments.round', { n: round.roundNumber })}</p>
            {round.matches.map((m) => (
              <MatchCard key={m.id} match={m} meId={meId} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Standings({ participants }: { participants: TournamentParticipant[] }) {
  const { t } = useTranslation();
  const sorted = [...participants].sort((a, b) => (a.finalPlacement ?? 999) - (b.finalPlacement ?? 999));
  return (
    <article className="rounded-2xl border border-tb-border bg-tb-surface p-6">
      <h2 className="font-display text-base font-bold text-tb-text">{t('tournaments.standings')}</h2>
      <ul className="mt-4 flex flex-col divide-y divide-tb-border">
        {sorted.map((p) => (
          <li key={p.userId} className="flex items-center gap-3 py-2.5">
            <span className="tb-nums w-8 text-sm font-bold text-tb-muted">{p.finalPlacement ?? '—'}</span>
            <Avatar initial={p.avatarInitial ?? p.username.charAt(0).toUpperCase()} color={p.avatarColor ?? '#2f6fe0'} size={32} />
            <span className="flex-1 truncate text-sm font-medium text-tb-text">{p.username}</span>
            {p.finalPlacement === 1 && <TrophyIcon className="h-4 w-4 shrink-0 text-tb-accent" />}
          </li>
        ))}
      </ul>
    </article>
  );
}

function TournamentDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const { me } = Route.useRouteContext();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.tournaments.getById.useQuery({ tournamentId: id }, { refetchInterval: 3000 });

  function invalidate() {
    void utils.tournaments.getById.invalidate({ tournamentId: id });
    void utils.tournaments.list.invalidate();
  }

  const register = trpc.tournaments.register.useMutation({ onSuccess: invalidate });
  const unregister = trpc.tournaments.unregister.useMutation({ onSuccess: invalidate });
  const checkIn = trpc.tournaments.checkIn.useMutation({ onSuccess: invalidate });
  const start = trpc.tournaments.start.useMutation({ onSuccess: invalidate });
  const cancel = trpc.tournaments.cancel.useMutation({ onSuccess: invalidate });

  if (isLoading) {
    return (
      <section>
        <div className="h-64 animate-pulse rounded-2xl border border-tb-border bg-tb-surface-2" />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="flex flex-col items-center gap-3 py-16 text-center">
        <TrophyIcon className="h-10 w-10 text-tb-muted" />
        <p className="text-sm text-tb-muted">{t('tournaments.notFound')}</p>
        <Link to="/torneos" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-tb-text hover:text-tb-accent">
          <ArrowLeftIcon />
          {t('tournaments.backToList')}
        </Link>
      </section>
    );
  }

  const { tournament, participants, rounds } = data;
  const myParticipant = participants.find((p) => p.userId === me.id);
  const isHost = tournament.hostUserId === me.id;
  const checkedInCount = participants.filter((p) => p.status === 'checked_in').length;

  return (
    <section className="flex flex-col gap-6">
      <Link to="/torneos" className="flex w-fit items-center gap-1.5 text-sm font-medium text-tb-muted hover:text-tb-text">
        <ArrowLeftIcon />
        {t('tournaments.backToList')}
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrophyIcon className="h-5 w-5 text-tb-accent" />
            <h1 className="font-display text-2xl font-extrabold">{tournament.name}</h1>
          </div>
          <p className="mt-1 text-sm text-tb-muted">
            {tournament.gameName} · {t(`tournaments.state.${tournament.state}`)}
          </p>
        </div>
        {isHost && tournament.state === 'registration' && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cancel.mutate({ tournamentId: id })}
              className="rounded-lg border border-tb-border px-4 py-2 text-sm font-medium text-tb-muted hover:border-tb-danger hover:text-tb-danger"
            >
              {t('tournaments.cancel')}
            </button>
            <button
              type="button"
              onClick={() => start.mutate({ tournamentId: id })}
              disabled={checkedInCount < 2 || start.isPending}
              className="tb-gradient-cta rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t('tournaments.start')}
            </button>
          </div>
        )}
      </header>
      {start.isError && <p className="text-xs text-tb-danger">{start.error.message}</p>}

      {tournament.state === 'registration' && (
        <RegistrationPanel
          participants={participants}
          myParticipant={myParticipant}
          onRegister={() => register.mutate({ tournamentId: id })}
          onUnregister={() => unregister.mutate({ tournamentId: id })}
          onToggleCheckIn={(checkedIn) => checkIn.mutate({ tournamentId: id, checkedIn })}
        />
      )}

      {(tournament.state === 'running' || tournament.state === 'finished') && <Bracket rounds={rounds} meId={me.id} />}

      {tournament.state === 'finished' && <Standings participants={participants} />}

      {tournament.state === 'cancelled' && <p className="text-sm text-tb-muted">{t('tournaments.cancelledNotice')}</p>}
    </section>
  );
}
