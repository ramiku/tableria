import { useEffect } from 'react';
import { Link, Outlet, createFileRoute, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { ChatIcon } from '../components/icons';
import { trpc } from '../lib/trpc';
import { matchSocket } from '../lib/ws';

export const Route = createFileRoute('/_app/mensajes')({ component: MessagesLayout });

/**
 * Vista clásica de chat a dos columnas: conversaciones a la izquierda, hilo
 * abierto a la derecha. En móvil se ve una columna cada vez (la lista en
 * /mensajes, el hilo al entrar en una conversación).
 */
function MessagesLayout() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.conversations.list.useQuery(undefined, { refetchInterval: 10_000 });
  const params = useParams({ strict: false }) as { conversationId?: string };
  const activeId = params.conversationId;

  // Cualquier DM entrante actualiza previas y contadores de la lista al momento.
  useEffect(() => {
    return matchSocket.onMessage((message) => {
      if (message.type === 'dm.message') void utils.conversations.list.invalidate();
    });
  }, [utils]);

  return (
    <section className="flex h-[calc(100dvh-7.5rem)] flex-col">
      <h1 className="font-display text-2xl font-extrabold text-tb-text">{t('messages.title')}</h1>

      <div className="mt-4 flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-tb-border bg-tb-surface">
        {/* Columna izquierda: conversaciones */}
        <aside
          className={`${activeId ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r border-tb-border md:w-72`}
        >
          {isLoading ? (
            <div className="flex flex-col gap-2 p-3">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-tb-surface-2" />
              ))}
            </div>
          ) : !data || data.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-tb-muted">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tb-surface-2">
                <ChatIcon />
              </span>
              <p className="text-sm">{t('messages.empty')}</p>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-tb-border overflow-y-auto">
              {data.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/mensajes/$conversationId"
                    params={{ conversationId: c.id }}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-tb-surface-2"
                    activeProps={{ className: 'bg-tb-accent-tint' }}
                  >
                    <Avatar
                      initial={c.otherUser?.avatarInitial ?? c.otherUser?.username.charAt(0).toUpperCase() ?? '?'}
                      color={c.otherUser?.avatarColor ?? '#2f6fe0'}
                      size={40}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-tb-text">
                        {c.otherUser?.displayName ?? t('messages.unknownUser')}
                      </span>
                      <span className="block truncate text-xs text-tb-muted">
                        {c.lastMessage
                          ? c.lastMessage.kind === 'invite'
                            ? t('messages.inviteSummary')
                            : c.lastMessage.body
                          : t('messages.noMessages')}
                      </span>
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-tb-accent px-1.5 text-[11px] font-bold text-tb-accent-fg">
                        {c.unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Columna derecha: hilo abierto (o estado vacío) */}
        <div className={`${activeId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
          <Outlet />
        </div>
      </div>
    </section>
  );
}
