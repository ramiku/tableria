import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_app/juegos/$slug')({ component: GamePage });

function GamePage() {
  const { t } = useTranslation();
  const { slug } = Route.useParams();
  return (
    <section>
      <h1 className="font-display text-2xl font-extrabold">{slug}</h1>
      <p className="mt-1 text-sm text-tb-muted">
        {t('game.detailEmpty', { milestone: t('game.milestoneM2') })}
      </p>
    </section>
  );
}
