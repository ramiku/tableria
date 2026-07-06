import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { UserHoverCard } from '../components/UserHoverCard';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/rankings')({ component: RankingsPage });

function RankingsPage() {
  const { t } = useTranslation();
  const { data: gamesList } = trpc.games.list.useQuery();
  const activeGames = (gamesList ?? []).filter((g) => g.isActive);
  const [gameId, setGameId] = useState<string | null>(null);
  const selectedGameId = gameId ?? activeGames[0]?.slug ?? null;

  const { data, isLoading } = trpc.ratings.leaderboard.useQuery(
    { gameId: selectedGameId! },
    { enabled: !!selectedGameId },
  );

  return (
    <section>
      <h1 className="font-display text-2xl font-extrabold">{t('rankings.title')}</h1>

      {activeGames.length === 0 ? (
        <p className="mt-3 text-sm text-tb-muted">{t('rankings.noActiveGames')}</p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeGames.map((g) => (
              <button
                key={g.slug}
                type="button"
                onClick={() => setGameId(g.slug)}
                aria-pressed={selectedGameId === g.slug}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  selectedGameId === g.slug
                    ? 'bg-tb-accent text-tb-accent-fg'
                    : 'border border-tb-border text-tb-muted hover:border-tb-accent hover:text-tb-accent'
                }`}
              >
                {g.name}
              </button>
            ))}
          </div>

          <article className="tb-card mt-4 rounded-2xl border border-tb-border bg-tb-surface p-6">
            {data?.season && (
              <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">
                {t('rankings.season', { name: data.season.name })}
              </p>
            )}

            {isLoading ? (
              <div className="mt-4 h-48 animate-pulse rounded-xl bg-tb-surface-2" />
            ) : !data || data.entries.length === 0 ? (
              <p className="mt-4 text-sm text-tb-muted">{t('rankings.empty')}</p>
            ) : (
              <table className="mt-4 w-full border-collapse">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-tb-muted">
                    <th className="w-10 pb-2">{t('rankings.rank')}</th>
                    <th className="pb-2">{t('rankings.player')}</th>
                    <th className="pb-2 text-right">{t('rankings.rating')}</th>
                    <th className="pb-2 text-right">{t('rankings.record')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tb-border">
                  {data.entries.map((entry, i) => (
                    <tr key={entry.userId}>
                      <td className="tb-nums py-3 text-sm font-bold text-tb-muted">{i + 1}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <UserHoverCard userId={entry.userId}>
                            <Avatar
                              initial={entry.avatarInitial ?? entry.username.charAt(0).toUpperCase()}
                              color={entry.avatarColor ?? '#2f6fe0'}
                              size={32}
                            />
                          </UserHoverCard>
                          <span className="text-sm font-semibold text-tb-text">{entry.username}</span>
                        </div>
                      </td>
                      <td className="tb-nums py-3 text-right font-display text-base font-extrabold text-tb-text">
                        {Math.round(entry.rating)}
                      </td>
                      <td className="tb-nums py-3 text-right text-xs text-tb-muted">
                        {entry.wins}-{entry.losses}-{entry.draws}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </article>
        </>
      )}
    </section>
  );
}
