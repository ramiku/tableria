import { useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { CardsIcon, ClockIcon, DiceIcon, DoorIcon, PlayIcon, BookIcon, ArrowLeftIcon, UsersIcon } from '../components/icons';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/juegos/$slug')({ component: GamePage });

const FALLBACK_COVER = '#2f6fe0';

function CategoryIcon({ categorySlug, className }: { categorySlug: string | null; className?: string }) {
  if (categorySlug === 'cartas') return <CardsIcon className={className} />;
  return <DiceIcon className={className} />;
}

function playerRange(min: number, max: number): string {
  return min === max ? String(min) : `${min}-${max}`;
}

function GamePage() {
  const { t } = useTranslation();
  const { slug } = Route.useParams();
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

  const { game, rules } = data;
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
        <div className="mt-4 rounded-2xl border border-tb-border bg-tb-surface p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                { Icon: DoorIcon, key: 'createRoom' },
                { Icon: UsersIcon, key: 'invite' },
                { Icon: PlayIcon, key: 'play' },
              ] as const
            ).map((step, i) => (
              <div key={step.key} className="flex flex-col gap-2 rounded-xl bg-tb-surface-2 p-4">
                <span className="tb-nums flex h-7 w-7 items-center justify-center rounded-full bg-tb-accent-tint text-xs font-bold text-tb-accent">
                  {i + 1}
                </span>
                <step.Icon className="h-5 w-5 text-tb-accent" />
                <p className="text-sm font-semibold text-tb-text">{t(`game.play.steps.${step.key}.title`)}</p>
                <p className="text-xs text-tb-muted">{t(`game.play.steps.${step.key}.body`)}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-tb-border pt-5">
            <p className="text-sm text-tb-muted">{t('game.play.availability', { milestone: t('game.milestoneM2') })}</p>
            <button
              type="button"
              disabled
              className="tb-gradient-cta flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white opacity-50"
            >
              <PlayIcon className="h-4 w-4" />
              {t('game.play.cta')}
            </button>
          </div>
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
