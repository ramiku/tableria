import { useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { ContinueBanner } from '../components/ContinueBanner';
import { GameCard, type GameSummary, type CategoryKey } from '../components/GameCard';
import { SearchIcon, PlusIcon } from '../components/icons';

export const Route = createFileRoute('/_app/')({ component: ExplorePage });

type FilterKey = 'all' | CategoryKey;

const filterDefs: { key: FilterKey; labelKey: string }[] = [
  { key: 'all', labelKey: 'explore.filterAll' },
  { key: 'board', labelKey: 'explore.filterBoard' },
  { key: 'cards', labelKey: 'explore.filterCards' },
];

// Catálogo estático hasta que M1 lo sirva desde la API.
// Tonos joya coherentes con el azul de marca, uno por juego.
const demoCatalog: GameSummary[] = [
  {
    slug: 'tres-en-raya',
    nameKey: 'demo.games.ticTacToe',
    category: 'board',
    players: '2',
    durationMin: 5,
    cover: '#1d3f72',
    badge: 'nuevo',
    livePlayers: 0,
  },
  {
    slug: 'conecta-cuatro',
    nameKey: 'demo.games.connect4',
    category: 'board',
    players: '2',
    durationMin: 10,
    cover: '#1c5c52',
    badge: 'pronto',
    livePlayers: null,
  },
  {
    slug: 'reversi',
    nameKey: 'demo.games.reversi',
    category: 'board',
    players: '2',
    durationMin: 20,
    cover: '#2f3a63',
    badge: 'pronto',
    livePlayers: null,
  },
  {
    slug: 'rummy',
    nameKey: 'demo.games.rummy',
    category: 'cards',
    players: '2-4',
    durationMin: 15,
    cover: '#4a2f6e',
    badge: 'pronto',
    livePlayers: null,
  },
  {
    slug: 'oca',
    nameKey: 'demo.games.oca',
    category: 'board',
    players: '2-6',
    durationMin: 15,
    cover: '#2f5c6e',
    badge: 'pronto',
    livePlayers: null,
  },
  {
    slug: 'mus',
    nameKey: 'demo.games.mus',
    category: 'cards',
    players: '4',
    durationMin: 20,
    cover: '#6e3b2f',
    badge: 'pronto',
    livePlayers: null,
  },
];

function useGreeting(name: string) {
  const { t } = useTranslation();
  const hour = new Date().getHours();
  if (hour < 12) return t('explore.greetingMorning', { name });
  if (hour < 20) return t('explore.greetingAfternoon', { name });
  return t('explore.greetingEvening', { name });
}

function ExplorePage() {
  const { t } = useTranslation();
  const greeting = useGreeting('Tableria');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(
    () =>
      demoCatalog.filter((game) => {
        if (filter !== 'all' && game.category !== filter) return false;
        // Para la búsqueda filtramos por el nombre ya traducido: pequeño detalle
        // para una demo con 6 entradas — M1 usará búsqueda real por slug.
        if (!query) return true;
        const translated = t(game.nameKey).toLowerCase();
        return translated.includes(query.toLowerCase());
      }),
    [query, filter, t],
  );
  const available = filtered.filter((g) => g.livePlayers !== null);
  const upcoming = filtered.filter((g) => g.livePlayers === null);

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

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{t('explore.catalog')}</h2>
        <div className="flex gap-1 rounded-lg border border-tb-border bg-tb-surface-2 p-1">
          {filterDefs.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                filter === f.key ? 'bg-tb-accent text-tb-accent-fg' : 'text-tb-muted hover:text-tb-text'
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
      </div>

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
          </div>
        </>
      )}

      {filtered.length === 0 && (
        <p className="mt-8 text-sm text-tb-muted">{t('explore.emptySearch')}</p>
      )}
    </section>
  );
}
