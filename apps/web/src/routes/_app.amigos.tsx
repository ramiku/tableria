import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/amigos')({
  beforeLoad: () => {
    throw redirect({ to: '/social/amigos' });
  },
});
