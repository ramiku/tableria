import { Link, Outlet, createFileRoute, useMatchRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/social')({ component: SocialLayout });

const INACTIVE_TAB_CLASS =
  'relative z-10 flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold text-tb-muted transition-colors hover:text-tb-text';
const ACTIVE_TAB_CLASS =
  'relative z-10 flex items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold text-tb-accent-fg';

/**
 * "Social" fusiona lo que antes eran dos entradas de menú separadas (Amigos y
 * Mensajes) en una sola página con pestañas — cada pestaña conserva tal cual el
 * contenido/comportamiento que ya tenía por separado, solo cambia dónde vive.
 *
 * El estado activo se calcula a mano con `useMatchRoute` en vez de `Link.activeProps`:
 * TanStack Router combina `className` + `activeProps.className` (no lo sustituye), así
 * que mezclar utilidades de Tailwind entre ambos (p.ej. `text-tb-muted` de base y
 * `text-tb-accent-fg` en activo) deja las dos clases de color aplicadas a la vez y el
 * orden de Tailwind en el CSS generado —no el del atributo class— decide cuál gana,
 * resultando en texto casi invisible sobre el fondo de color.
 */
function SocialLayout() {
  const { t } = useTranslation();
  const matchRoute = useMatchRoute();
  const { data: pending } = trpc.friends.listPending.useQuery();
  const pendingCount = pending?.incoming.length ?? 0;
  const onAmigos = !!matchRoute({ to: '/social/amigos', fuzzy: true });

  return (
    // Altura = viewport menos el chrome del shell: móvil = topbar 3.5rem + padding superior
    // 1.25rem + hueco de la bottom nav 4.5rem (+safe area); escritorio = 7.5rem como siempre.
    <section className="flex h-[calc(100dvh-9.25rem-env(safe-area-inset-bottom))] flex-col lg:h-[calc(100dvh-7.5rem)]">
      <h1 className="font-display text-2xl font-extrabold text-tb-text">{t('social.title')}</h1>

      <nav
        aria-label={t('social.tabsAria')}
        className="relative mt-4 grid w-72 grid-cols-2 gap-1 rounded-xl border border-tb-border bg-tb-surface-2 p-1"
      >
        <span
          aria-hidden
          className={`tb-gradient-cta absolute inset-y-1 left-1 w-[calc(50%-0.375rem)] rounded-lg shadow-sm transition-transform duration-200 ease-out ${
            onAmigos ? 'translate-x-[calc(100%+0.5rem)]' : 'translate-x-0'
          }`}
        />
        <Link to="/social/mensajes" className={onAmigos ? INACTIVE_TAB_CLASS : ACTIVE_TAB_CLASS}>
          {t('nav.messages')}
        </Link>
        <Link to="/social/amigos" className={onAmigos ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS}>
          {t('nav.friends')}
          {pendingCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-tb-danger px-1 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </Link>
      </nav>

      <div className="mt-4 min-h-0 flex-1">
        <Outlet />
      </div>
    </section>
  );
}
