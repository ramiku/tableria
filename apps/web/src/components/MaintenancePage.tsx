import { useTranslation } from 'react-i18next';
import { GearIcon } from './icons';

export function MaintenancePage({ message }: { message: string | null }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-tb-bg px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-tb-surface-2 text-tb-accent">
        <GearIcon />
      </span>
      <h1 className="font-display text-2xl font-extrabold text-tb-text">{t('maintenance.title')}</h1>
      <p className="max-w-md text-sm text-tb-muted">{message || t('maintenance.defaultMessage')}</p>
    </div>
  );
}
