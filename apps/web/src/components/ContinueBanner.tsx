import { useTranslation } from 'react-i18next';
import { formatDuration } from '../lib/formatDuration';
import { useCountdownSeconds } from '../lib/useCountdown';
import { Avatar } from './Avatar';
import { ArrowRightIcon } from './icons';

interface ContinueBannerProps {
  gameName: string;
  withNames: string;
  turnDeadlineAt: string | null;
  onResume: () => void;
}

/** Partida por turnos donde ahora mismo te toca mover — ver `matches.myTurn` (backend) y su uso en `_app.index.tsx`. */
export function ContinueBanner({ gameName, withNames, turnDeadlineAt, onResume }: ContinueBannerProps) {
  const { t } = useTranslation();
  const deadlineSeconds = useCountdownSeconds(turnDeadlineAt);

  return (
    <div className="tb-card flex items-center gap-4 rounded-xl border border-tb-border bg-gradient-to-r from-tb-accent-tint to-tb-surface-2 p-4">
      <Avatar initial={gameName.charAt(0)} color="#2f6fe0" size={44} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-tb-accent">
          {t('continueBanner.title')}
        </p>
        <p className="truncate font-display text-base font-bold text-tb-text">
          {withNames ? `${gameName} · ${t('continueBanner.with')} ${withNames}` : gameName}
        </p>
        <p className="tb-nums text-xs text-tb-muted">
          <span className="font-semibold text-tb-success">{t('continueBanner.yourTurn')}</span>
          {deadlineSeconds !== null && (
            <span className="ml-1">· {t('continueBanner.timeLeft', { time: formatDuration(deadlineSeconds) })}</span>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onResume}
        className="tb-gradient-cta flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {t('continueBanner.resume')}
        <ArrowRightIcon />
      </button>
    </div>
  );
}
