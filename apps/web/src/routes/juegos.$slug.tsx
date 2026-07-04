import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/juegos/$slug')({ component: GamePage });

function GamePage() {
  const { slug } = Route.useParams();
  return (
    <section>
      <h1 className="font-display text-2xl font-extrabold">{slug}</h1>
      <p className="mt-1 text-sm text-tb-muted">
        Ficha del juego — lobby de mesas en M2.
      </p>
    </section>
  );
}
