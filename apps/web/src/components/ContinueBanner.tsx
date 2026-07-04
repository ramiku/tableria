import { useTranslation } from 'react-i18next';
import { Avatar } from './Avatar';
import { ArrowRightIcon } from './icons';

interface ContinueBannerProps {
  gameName: string;
  withNames: string;
  turnLabel: string;
  yourTurn: boolean;
}

export function ContinueBanner({ gameName, withNames, turnLabel, yourTurn }: ContinueBannerProps) {
  const { t } = useTranslation();
  return (
    <div className="tb-card flex items-center gap-4 rounded-xl border border-tb-border bg-gradient-to-r from-tb-accent-tint to-tb-surface-2 p-4">
      <Avatar initial={gameName.charAt(0)} color="#2f6fe0" size={44} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-tb-accent">
          {t('continueBanner.title')}
        </p>
        <p className="truncate font-display text-base font-bold text-tb-text">
          {gameName} · {t('continueBanner.with')} {withNames}
        </p>
        <p className="tb-nums text-xs text-tb-muted">
          {turnLabel}
          {yourTurn && (
            <span className="ml-1 font-semibold text-tb-success">· {t('continueBanner.yourTurn')}</span>
          )}
        </p>
      </div>
      <button
        type="button"
        className="tb-gradient-cta flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        {t('continueBanner.resume')}
        <ArrowRightIcon />
      </button>
    </div>
  );
}
