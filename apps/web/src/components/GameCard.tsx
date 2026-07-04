import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';

export type BadgeKey = 'nuevo' | 'pronto';
export type CategoryKey = 'board' | 'cards';

export interface GameSummary {
  slug: string;
  nameKey: string;
  category: CategoryKey;
  players: string;
  durationMin: number;
  cover: string;
  badge: BadgeKey | null;
  livePlayers: number | null;
}

export function GameCard({ game }: { game: GameSummary }) {
  const { t } = useTranslation();
  const isPlayable = game.livePlayers !== null;

  return (
    <Link
      to="/juegos/$slug"
      params={{ slug: game.slug }}
      className="tb-card group overflow-hidden rounded-xl border border-tb-border bg-tb-surface transition-transform duration-150 hover:-translate-y-0.5"
    >
      <div
        className="relative flex h-28 items-end p-3 font-display text-lg font-bold text-white"
        style={{ background: game.cover }}
      >
        {game.badge && (
          <span className="absolute left-2 top-2 rounded-md bg-black/35 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            {t(`game.badge.${game.badge}`)}
          </span>
        )}
        <span className="tb-hex tb-nums absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center bg-black/35 px-1.5 text-[11px] font-bold text-white">
          {game.players}
        </span>
        {t(game.nameKey)}
      </div>
      <div className="flex items-center justify-between p-3">
        <p className="text-xs text-tb-muted">
          {t(`game.category.${game.category}`)} · {game.durationMin} min
        </p>
        <p className="tb-nums flex items-center gap-1.5 text-xs font-medium text-tb-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isPlayable ? 'bg-tb-success' : 'bg-tb-border'}`}
            aria-hidden="true"
          />
          {isPlayable
            ? t('game.status.playing', { count: game.livePlayers ?? 0 })
            : t('game.status.coming')}
        </p>
      </div>
    </Link>
  );
}
