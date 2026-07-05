import { useState, type FormEvent } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { PlusIcon, TrophyIcon, UsersIcon } from '../components/icons';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/torneos/')({ component: TournamentsPage });

const STATE_STYLES: Record<string, string> = {
  registration: 'bg-tb-accent-tint text-tb-accent',
  running: 'bg-tb-success/15 text-tb-success',
  finished: 'bg-tb-surface-2 text-tb-muted',
  cancelled: 'bg-tb-danger/15 text-tb-danger',
};

function CreateTournamentForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data: gamesList } = trpc.games.list.useQuery();
  const activeGames = (gamesList ?? []).filter((g) => g.isActive);
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState(activeGames[0]?.slug ?? '');
  const [rated, setRated] = useState(true);

  const create = trpc.tournaments.create.useMutation({
    onSuccess: () => {
      void utils.tournaments.list.invalidate();
      onDone();
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !gameId) return;
    create.mutate({ name: name.trim(), gameId, rated });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4 rounded-2xl border border-tb-border bg-tb-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('tournaments.form.name')}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-2 text-sm text-tb-text outline-none focus:border-tb-accent"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('tournaments.form.game')}</span>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-2 text-sm text-tb-text outline-none focus:border-tb-accent"
          >
            {activeGames.map((g) => (
              <option key={g.slug} value={g.slug}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-tb-border bg-tb-surface-2 px-4 py-3">
        <span className="text-sm font-semibold text-tb-text">{t('tournaments.form.rated')}</span>
        <input type="checkbox" checked={rated} onChange={(e) => setRated(e.target.checked)} className="h-4 w-4 accent-tb-accent" />
      </label>
      {create.isError && <p className="text-xs text-tb-danger">{create.error.message}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-lg border border-tb-border px-4 py-2 text-sm font-medium text-tb-muted hover:bg-tb-surface-2">
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={create.isPending || !name.trim() || !gameId}
          className="tb-gradient-cta rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t('tournaments.form.submit')}
        </button>
      </div>
    </form>
  );
}

function TournamentsPage() {
  const { t } = useTranslation();
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = trpc.tournaments.list.useQuery(undefined, { refetchInterval: 5000 });

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold">{t('tournaments.title')}</h1>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="tb-gradient-cta flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon className="h-4 w-4" />
            {t('tournaments.create')}
          </button>
        )}
      </header>

      {creating && <CreateTournamentForm onDone={() => setCreating(false)} />}

      <div className="mt-6">
        {isLoading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-tb-border bg-tb-surface-2" />
            ))}
          </div>
        )}

        {!isLoading && (data?.length ?? 0) === 0 && <p className="mt-8 text-sm text-tb-muted">{t('tournaments.empty')}</p>}

        {!isLoading && (data?.length ?? 0) > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {data!.map((tournament) => (
              <Link
                key={tournament.id}
                to="/torneos/$id"
                params={{ id: tournament.id }}
                className="flex items-center justify-between rounded-2xl border border-tb-border bg-tb-surface p-4 transition-colors hover:border-tb-accent"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TrophyIcon className="h-4 w-4 shrink-0 text-tb-accent" />
                    <p className="truncate font-display text-sm font-bold text-tb-text">{tournament.name}</p>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-tb-muted">
                    {tournament.gameName}
                    <span aria-hidden="true">·</span>
                    <UsersIcon className="h-3.5 w-3.5" />
                    {tournament.participantCount}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_STYLES[tournament.state] ?? ''}`}>
                  {t(`tournaments.state.${tournament.state}`)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
