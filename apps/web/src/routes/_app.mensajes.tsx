import { Outlet, createFileRoute } from '@tanstack/react-router';

// Ruta vieja: el contenido real vive ahora bajo /social/mensajes (ver `_app.social.mensajes.tsx`).
// Este layout no redirige por sí mismo — así cada hija (`index`/`$conversationId`) puede
// redirigir a su equivalente exacto bajo /social, conservando el conversationId si lo hay.
export const Route = createFileRoute('/_app/mensajes')({ component: () => <Outlet /> });
