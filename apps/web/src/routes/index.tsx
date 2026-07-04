import { Link, createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/')({ component: ExplorePage });

// Catálogo estático hasta que M1 lo sirva desde la API
const demoCatalog = [
  { slug: 'tres-en-raya', name: '3 en raya', bg: '#2f6f4f', active: true },
  { slug: 'conecta-cuatro', name: 'Conecta 4', bg: '#26466e', active: false },
  { slug: 'reversi', name: 'Reversi', bg: '#1d3a2f', active: false },
];

function ExplorePage() {
  const { t } = useTranslation();
  return (
    <section>
      <h1 className="font-display text-2xl font-extrabold">{t('explore.title')}</h1>
      <p className="mt-1 text-sm text-tb-muted">{t('explore.subtitle')}</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {demoCatalog.map((game) => (
          <Link
            key={game.slug}
            to="/juegos/$slug"
            params={{ slug: game.slug }}
            className="group overflow-hidden rounded-xl border border-tb-border bg-tb-surface-2 transition-transform hover:-translate-y-0.5"
          >
            <div
              className="flex h-28 items-end p-3 font-display text-lg font-bold text-tb-accent-fg"
              style={{ background: game.bg }}
            >
              {game.name}
            </div>
            <div className="p-3 text-xs text-tb-muted">
              {game.active ? '2 jugadores · rápido' : t('common.soon')}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
