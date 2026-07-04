import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ContinueBanner } from '../components/ContinueBanner';
import { GameCard } from '../components/GameCard';
import { CardsIcon, PlusIcon, SearchIcon, UsersIcon } from '../components/icons';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/')({ component: ExplorePage });

function useGreeting(name: string) {
  const { t } = useTranslation();
  const hour = new Date().getHours();
  if (hour < 12) return t('explore.greetingMorning', { name });
  if (hour < 20) return t('explore.greetingAfternoon', { name });
  return t('explore.greetingEvening', { name });
}

function CatalogSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-[13.5rem] animate-pulse rounded-2xl border border-tb-border bg-tb-surface-2" />
      ))}
    </div>
  );
}

function ExplorePage() {
  const { t } = useTranslation();
  const greeting = useGreeting('Tableria');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const { data: catalog, isLoading, isError } = trpc.games.list.useQuery();

  const categories = useMemo(() => {
    if (!catalog) return [];
    const seen = new Map<string, string>();
    for (const game of catalog) {
      if (game.categorySlug && game.categoryName && !seen.has(game.categorySlug)) {
        seen.set(game.categorySlug, game.categoryName);
      }
    }
    return Array.from(seen, ([slug, name]) => ({ slug, name }));
  }, [catalog]);

  const filtered = useMemo(() => {
    if (!catalog) return [];
    return catalog.filter((game) => {
      if (filter !== 'all' && game.categorySlug !== filter) return false;
      if (!query) return true;
      return game.name.toLowerCase().includes(query.toLowerCase());
    });
  }, [catalog, query, filter]);

  const available = filtered.filter((g) => g.isActive);
  const upcoming = filtered.filter((g) => !g.isActive);

  return (
    <section>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-tb-muted">{greeting}</p>
          <h1 className="font-display text-2xl font-extrabold">{t('explore.headline')}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tb-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('explore.searchPlaceholder')}
              className="w-56 rounded-lg border border-tb-border bg-tb-surface-2 py-2 pl-9 pr-3 text-sm text-tb-text placeholder:text-tb-muted"
            />
          </div>
          <button
            type="button"
            className="tb-gradient-cta flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <PlusIcon />
            {t('explore.createRoom')}
          </button>
        </div>
      </header>

      <div className="mt-5">
        <ContinueBanner
          gameName={t('demo.banner.game')}
          withNames={t('demo.banner.with')}
          turnLabel={t('demo.banner.turn')}
          yourTurn
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">{t('explore.catalog')}</h2>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 rounded-lg border border-tb-border bg-tb-surface-2 p-1">
            <button
              type="button"
              onClick={() => setFilter('all')}
              aria-pressed={filter === 'all'}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-tb-accent text-tb-accent-fg' : 'text-tb-muted hover:text-tb-text'
              }`}
            >
              {t('explore.filterAll')}
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setFilter(c.slug)}
                aria-pressed={filter === c.slug}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  filter === c.slug ? 'bg-tb-accent text-tb-accent-fg' : 'text-tb-muted hover:text-tb-text'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && <CatalogSkeleton />}

      {isError && <p className="mt-8 text-sm text-tb-danger">{t('explore.loadError')}</p>}

      {!isLoading && !isError && (
        <>
          {available.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              {available.map((game) => (
                <GameCard key={game.slug} game={game} />
              ))}
            </div>
          )}

          {upcoming.length > 0 && (
            <>
              <h2 className="mt-8 font-display text-lg font-bold">{t('explore.soon')}</h2>
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                {upcoming.map((game) => (
                  <GameCard key={game.slug} game={game} />
                ))}
                {filter === 'all' && !query && (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-tb-border p-6 text-center">
                    <div className="flex -space-x-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-tb-surface bg-tb-accent-tint text-tb-accent">
                        <CardsIcon className="h-4.5 w-4.5" />
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-tb-surface bg-tb-accent-tint text-tb-accent">
                        <UsersIcon className="h-4.5 w-4.5" />
                      </span>
                    </div>
                    <p className="text-sm font-medium text-tb-text">{t('explore.moreComing.title')}</p>
                    <p className="text-xs text-tb-muted">{t('explore.moreComing.body')}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {filtered.length === 0 && <p className="mt-8 text-sm text-tb-muted">{t('explore.emptySearch')}</p>}
        </>
      )}
    </section>
  );
}
