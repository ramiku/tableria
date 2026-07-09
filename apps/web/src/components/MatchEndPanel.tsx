import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { ServerMessage } from '@tableria/protocol';
import { trpc } from '../lib/trpc';
import { ArrowLeftIcon, GridIcon, MedalIcon } from './icons';
import { SUMMARY_COMPONENTS } from './MatchSummaries';
import { UserHoverCard } from './UserHoverCard';

type EndedPayload = Extract<ServerMessage, { type: 'match.ended' }>['payload'];
type MatchPlayer = { seat: number; userId: string; username: string; connected: boolean };

interface MatchEndPanelProps {
  matchId: string;
  gameId: string;
  gameName: string;
  ended: EndedPayload;
  players: MatchPlayer[];
  mySeat: number | null;
  isSpectator: boolean;
  view: unknown;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const MEDAL_ACCENT: Record<number, string> = { 1: 'tb-medal-1', 2: 'tb-medal-2', 3: 'tb-medal-3' };

const RESULT_BADGE_TONE: Record<'win' | 'lose' | 'draw', string> = {
  win: 'bg-tb-success/15 text-tb-success',
  lose: 'bg-tb-danger/10 text-tb-danger',
  draw: 'bg-tb-surface-2 text-tb-muted',
};

/**
 * Panel de fin de partida con dos pestañas — sustituye al modal simple de antes: "Resultado"
 * (clasificación completa de la mesa, no solo el resultado propio) y "Situación final" (oculta
 * el panel para dejar ver el tablero, que sigue montado detrás e inerte). El interruptor de
 * pestañas vive en una píldora fija en la esquina para poder volver desde cualquiera de las dos.
 */
export function MatchEndPanel({ matchId, gameId, gameName, ended, players, mySeat, isSpectator, view }: MatchEndPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'result' | 'board'>('result');
  const [rematchCode, setRematchCode] = useState<string | null>(null);

  const userIds = players.map((p) => p.userId);
  const { data: gameStats } = trpc.ratings.gameStats.useQuery({ gameId, userIds }, { enabled: userIds.length > 0 });
  const rematchMutation = trpc.matches.rematch.useMutation();

  function handleRematch(invite: boolean) {
    rematchMutation.mutate(
      { matchId, invite },
      {
        onSuccess: (result) => {
          if (invite) setRematchCode(result.code);
          else void navigate({ to: '/sala/$code', params: { code: result.code } });
        },
      },
    );
  }

  const myResult = mySeat !== null ? ended.ranking.find((r) => r.seat === mySeat)?.result : undefined;
  const sortedRanking = [...ended.ranking].sort((a, b) => a.placement - b.placement);
  const SummaryComponent = SUMMARY_COMPONENTS[gameId];

  const title =
    gameId === 'cronolito' && ended.reason === 'completed'
      ? t(ended.ranking.some((r) => r.result === 'win') ? 'cronolito.endedSuccess' : 'cronolito.endedFailure')
      : t(
          ended.reason === 'abandoned'
            ? 'partida.endedAbandoned'
            : ended.reason === 'forfeit'
              ? 'partida.endedForfeit'
              : 'partida.endedCompleted',
        );

  const subtitle =
    ended.reason === 'abandoned'
      ? t('partida.resultAbandoned')
      : isSpectator
        ? t('partida.resultSpectator')
        : gameId === 'cronolito' && ended.reason === 'completed'
          ? t(myResult === 'win' ? 'cronolito.resultSurvived' : 'cronolito.resultEliminated')
          : t(myResult === 'win' ? 'partida.resultWin' : myResult === 'draw' ? 'partida.resultDraw' : 'partida.resultLoss');

  function playerLabel(seat: number): string {
    if (seat === mySeat) return t('partida.matchEnd.you');
    return players.find((p) => p.seat === seat)?.username ?? '';
  }

  return (
    <>
      <div className="tb-modal-in absolute right-3 top-3 z-20 flex gap-1 rounded-full border border-tb-border bg-tb-surface/95 p-1 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setTab('result')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === 'result' ? 'bg-tb-accent-tint text-tb-accent' : 'text-tb-muted hover:text-tb-text'
          }`}
        >
          <MedalIcon className="h-3.5 w-3.5" />
          {t('partida.matchEnd.tabResult')}
        </button>
        <button
          type="button"
          onClick={() => setTab('board')}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            tab === 'board' ? 'bg-tb-accent-tint text-tb-accent' : 'text-tb-muted hover:text-tb-text'
          }`}
        >
          <GridIcon className="h-3.5 w-3.5" />
          {t('partida.matchEnd.tabBoard')}
        </button>
      </div>

      {tab === 'result' && (
        <div className="tb-modal-in absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-tb-surface/25 p-4">
          <div className="flex max-h-full w-full max-w-md flex-col items-center gap-4 overflow-y-auto rounded-2xl border border-tb-border bg-tb-surface/95 p-7 text-center shadow-2xl backdrop-blur-md">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tb-accent-tint text-tb-accent">
              <MedalIcon className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-xl font-bold text-tb-text">{title}</h1>
              <p className="mt-1 text-sm text-tb-muted">{subtitle}</p>
            </div>

            {sortedRanking.length > 0 && (
              <div className="w-full">
                <p className="mb-2 text-left text-xs font-bold uppercase tracking-wide text-tb-muted">
                  {t('partida.matchEnd.rankingTitle')}
                </p>
                <div className="w-full divide-y divide-tb-border overflow-hidden rounded-xl border border-tb-border">
                  {sortedRanking.map((r, i) => {
                    const delta = ended.ratingDeltas?.find((d) => d.seat === r.seat);
                    return (
                      <div
                        key={r.seat}
                        style={{ animationDelay: `${i * 60}ms` }}
                        className={`tb-fade-in-up flex items-center gap-3 px-3.5 py-2.5 ${r.seat === mySeat ? 'bg-tb-accent-tint/40' : ''} ${MEDAL_ACCENT[r.placement] ?? ''}`}
                      >
                        <span className="tb-nums w-7 shrink-0 text-center text-sm font-bold text-tb-text">
                          {MEDALS[r.placement] ?? `#${r.placement}`}
                        </span>
                        {r.seat !== mySeat ? (
                          <UserHoverCard userId={players.find((p) => p.seat === r.seat)?.userId ?? ''}>
                            <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-tb-text">
                              {playerLabel(r.seat)}
                            </span>
                          </UserHoverCard>
                        ) : (
                          <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-tb-text">
                            {playerLabel(r.seat)}
                          </span>
                        )}
                        {delta && (
                          <span className="tb-nums hidden shrink-0 text-xs font-medium text-tb-muted sm:inline">
                            {Math.round(delta.ratingBefore)} → {Math.round(delta.ratingAfter)}{' '}
                            <span
                              className={
                                delta.ratingAfter >= delta.ratingBefore ? 'text-tb-success' : 'text-tb-danger'
                              }
                            >
                              ({delta.ratingAfter >= delta.ratingBefore ? '+' : ''}
                              {Math.round(delta.ratingAfter - delta.ratingBefore)})
                            </span>
                          </span>
                        )}
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${RESULT_BADGE_TONE[r.result]}`}
                        >
                          {t(`partida.matchEnd.resultBadge.${r.result}`)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {SummaryComponent && <SummaryComponent view={view} players={players} mySeat={mySeat} />}

            {gameStats && gameStats.length > 0 && (
              <div className="w-full">
                <p className="mb-2 text-left text-xs font-bold uppercase tracking-wide text-tb-muted">
                  {t('partida.matchEnd.yourHistoryTitle', { game: gameName })}
                </p>
                <div className="w-full divide-y divide-tb-border overflow-hidden rounded-xl border border-tb-border">
                  {gameStats.map((s) => {
                    const player = players.find((p) => p.userId === s.userId);
                    if (!player) return null;
                    return (
                      <div
                        key={s.userId}
                        className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-3.5 py-2 text-xs ${
                          player.seat === mySeat ? 'bg-tb-accent-tint/40' : ''
                        }`}
                      >
                        <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-tb-text">
                          {player.seat === mySeat ? t('partida.matchEnd.you') : player.username}
                        </span>
                        <span className="tb-nums shrink-0 text-tb-muted">{t('partida.matchEnd.historyPlayed', { n: s.played })}</span>
                        <span className="tb-nums shrink-0 text-tb-muted">
                          {s.wins}-{s.losses}-{s.draws}
                        </span>
                        <span className="tb-nums shrink-0 font-semibold text-tb-text">
                          {s.rating !== null
                            ? t('partida.matchEnd.historyRatingPeak', { rating: Math.round(s.rating), peak: Math.round(s.peakRating!) })
                            : t('partida.matchEnd.historyNoRating')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {rematchMutation.isError && <p className="text-xs font-medium text-tb-danger">{t('partida.matchEnd.rematchError')}</p>}

            <div className="mt-1 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              {!isSpectator &&
                (rematchCode ? (
                  <Link
                    to="/sala/$code"
                    params={{ code: rematchCode }}
                    className="tb-gradient-cta flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    {t('partida.matchEnd.rematchPending')}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRematch(true)}
                    disabled={rematchMutation.isPending}
                    className="tb-gradient-cta flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {t('partida.matchEnd.proposeRematch')}
                  </button>
                ))}
              {!isSpectator && (
                <button
                  type="button"
                  onClick={() => handleRematch(false)}
                  disabled={rematchMutation.isPending}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-tb-border px-3.5 py-2 text-sm font-medium text-tb-text hover:bg-tb-surface-2 disabled:opacity-60"
                >
                  {t('partida.matchEnd.playAgain')}
                </button>
              )}
              <Link
                to="/"
                className="flex items-center justify-center gap-1.5 rounded-lg border border-tb-border px-3.5 py-2 text-sm font-medium text-tb-text hover:bg-tb-surface-2"
              >
                <ArrowLeftIcon />
                {t('game.backToCatalog')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
