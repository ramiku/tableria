import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/amigos')({ component: FriendsPage });

function FriendsPage() {
  const { t } = useTranslation();
  return (
    <section>
      <h1 className="font-display text-2xl font-extrabold">{t('friends.title')}</h1>
      <p className="mt-1 text-sm text-tb-muted">{t('rail.empty')} — llega en M3.</p>
    </section>
  );
}
