import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/social/')({
  beforeLoad: () => {
    throw redirect({ to: '/social/mensajes' });
  },
});
