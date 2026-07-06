import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/mensajes/$conversationId')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/social/mensajes/$conversationId', params });
  },
});
