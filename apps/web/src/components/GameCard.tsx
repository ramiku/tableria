import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { CardsIcon, ClockIcon, DiceIcon, UsersIcon } from './icons';

export interface GameSummary {
  slug: string;
  name: string;
  categorySlug: string | null;
  categoryName: string | null;
  minPlayers: number;
  maxPlayers: number;
  durationMin: number | null;
  badge: string | null;
  coverBg: string | null;
  coverFg: string | null;
  description: string | null;
  isActive: boolean;
}

const FALLBACK_COVER = '#2f6fe0';

function CategoryIcon({ categorySlug, className }: { categorySlug: string | null; className?: string }) {
  if (categorySlug === 'cartas') return <CardsIcon className={className} />;
  return <DiceIcon className={className} />;
}

function playerRange(min: number, max: number): string {
  return min === max ? String(min) : `${min}-${max}`;
}

export function GameCard({ game }: { game: GameSummary }) {
  const { t } = useTranslation();
  const cover = game.coverBg ?? FALLBACK_COVER;

  return (
    <Link
      to="/juegos/$slug"
      params={{ slug: game.slug }}
      className="tb-card group relative flex flex-col overflow-hidden rounded-2xl border border-tb-border bg-tb-surface transition-all duration-200 hover:-translate-y-1 hover:border-tb-accent/50 hover:shadow-lg"
    >
      <div
        className="relative flex h-32 items-end overflow-hidden p-3.5"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${cover} 100%, white 12%) 0%, ${cover} 55%, color-mix(in srgb, ${cover} 100%, black 25%) 100%)`,
        }}
      >
        {/* Motivo decorativo: icono de categoría, grande y sutil, ancla la personalidad de la portada */}
        <CategoryIcon
          categorySlug={game.categorySlug}
          className="pointer-events-none absolute -bottom-3 -right-3 h-20 w-20 rotate-[-12deg] text-white/15 transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105"
        />

        {game.badge && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-black/30 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {game.badge}
          </span>
        )}
        <span className="tb-hex tb-nums absolute right-2.5 top-2.5 flex h-6 min-w-6 items-center justify-center gap-0.5 bg-black/30 px-2 text-[11px] font-bold text-white backdrop-blur-sm">
          <UsersIcon className="h-3 w-3" />
          {playerRange(game.minPlayers, game.maxPlayers)}
        </span>

        <span className="relative font-display text-lg font-extrabold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
          {game.name}
        </span>
      </div>

      <div className="flex items-center justify-between px-3.5 py-3">
        <p className="flex items-center gap-1.5 text-xs text-tb-muted">
          <CategoryIcon categorySlug={game.categorySlug} className="h-3.5 w-3.5 shrink-0" />
          {game.categoryName ?? t('game.category.other')}
          {game.durationMin != null && (
            <>
              <span aria-hidden="true">·</span>
              <ClockIcon className="h-3.5 w-3.5 shrink-0" />
              {t('game.durationMin', { count: game.durationMin })}
            </>
          )}
        </p>
        <p className="tb-nums flex shrink-0 items-center gap-1.5 text-xs font-medium text-tb-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${game.isActive ? 'bg-tb-success' : 'bg-tb-border'}`}
            aria-hidden="true"
          />
          {game.isActive ? t('game.status.available') : t('game.status.comingSoon')}
        </p>
      </div>
    </Link>
  );
}
