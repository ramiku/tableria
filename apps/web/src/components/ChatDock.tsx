import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { ServerMessage } from '@tableria/protocol';
import { getConversationDisplay } from '../lib/conversationDisplay';
import { matchSocket } from '../lib/ws';
import { trpc } from '../lib/trpc';
import { useChatDock } from '../stores/chatDock';
import { Avatar } from './Avatar';
import { ChatIcon, CloseIcon, SendIcon } from './icons';
import { VoiceCallBar } from './VoiceCallBar';

type DmPayload = Extract<ServerMessage, { type: 'dm.message' }>['payload'];

/**
 * Dock de chat flotante abajo-derecha: burbuja + panel de conversación.
 * Contestar nunca navega. La X del panel lo minimiza a burbuja; la burbuja
 * reabre el chat y solo desaparece con su propia X.
 */
export function ChatDock({ meId }: { meId: string }) {
  const conversationId = useChatDock((s) => s.conversationId);
  const minimized = useChatDock((s) => s.minimized);
  const fallbackName = useChatDock((s) => s.fallbackName);
  const openChat = useChatDock((s) => s.openChat);
  const minimizeChat = useChatDock((s) => s.minimizeChat);
  const closeChat = useChatDock((s) => s.closeChat);
  const utils = trpc.useUtils();
  const [incoming, setIncoming] = useState<DmPayload | null>(null);

  useEffect(() => {
    return matchSocket.onMessage((message) => {
      if (message.type !== 'dm.message') return;
      const dm = message.payload;
      // Mantener frescas las previas (la burbuja minimizada muestra el último mensaje).
      void utils.conversations.list.invalidate();
      if (dm.userId === meId) return; // eco de un mensaje propio
      // Si esa conversación ya vive en el dock (panel o burbuja) o en /social/mensajes, no hace falta burbuja nueva.
      if (useChatDock.getState().conversationId === dm.conversationId) return;
      if (window.location.pathname === `/social/mensajes/${dm.conversationId}`) return;
      setIncoming(dm);
    });
  }, [meId, utils]);

  // Si la conversación de la burbuja entrante se abre por otro camino, la burbuja sobra.
  useEffect(() => {
    if (incoming && conversationId === incoming.conversationId) setIncoming(null);
  }, [conversationId, incoming]);

  const panelOpen = conversationId !== null && !minimized;
  const bubbleShown = conversationId !== null && minimized;

  return (
    <>
      {panelOpen && (
        <DockPanel key={conversationId} conversationId={conversationId} meId={meId} onMinimize={minimizeChat} />
      )}

      {bubbleShown && (
        <MinimizedBubble
          conversationId={conversationId}
          fallbackName={fallbackName}
          onOpen={() => openChat(conversationId, fallbackName ?? undefined)}
          onDismiss={closeChat}
        />
      )}

      {incoming && (
        <IncomingBubble
          dm={incoming}
          raise={panelOpen ? 'panel' : bubbleShown ? 'bubble' : 'none'}
          onOpen={() => {
            openChat(incoming.conversationId, incoming.username ?? undefined);
            setIncoming(null);
          }}
          onDismiss={() => setIncoming(null)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Burbujas
// ---------------------------------------------------------------------------

interface BubbleShellProps {
  name: string;
  avatarInitial: string;
  avatarColor: string;
  preview: string;
  hint: string;
  positionClass: string;
  onOpen: () => void;
  onDismiss: () => void;
  dismissLabel: string;
}

function BubbleShell({ name, avatarInitial, avatarColor, preview, hint, positionClass, onOpen, onDismiss, dismissLabel }: BubbleShellProps) {
  return (
    <div
      className={`fixed right-4 z-50 w-[calc(100vw-2rem)] max-w-80 rounded-2xl border border-tb-border bg-tb-surface p-4 shadow-xl sm:right-6 sm:w-80 ${positionClass}`}
    >
      <div className="flex items-start gap-3">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <Avatar initial={avatarInitial} color={avatarColor} size={40} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <ChatIcon className="h-3.5 w-3.5 shrink-0 text-tb-accent" />
              <span className="truncate text-sm font-semibold text-tb-text">{name}</span>
            </span>
            <span className="mt-0.5 block truncate text-sm text-tb-muted">{preview}</span>
            <span className="mt-1 block text-xs font-semibold text-tb-accent">{hint}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-tb-muted transition-colors hover:bg-tb-surface-2 hover:text-tb-danger"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}

/** Burbuja de la conversación minimizada: reabre el panel; su X cierra el dock del todo. */
function MinimizedBubble({
  conversationId,
  fallbackName,
  onOpen,
  onDismiss,
}: {
  conversationId: string;
  fallbackName: string | null;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const { data: conversations } = trpc.conversations.list.useQuery();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const display = getConversationDisplay(conversation, fallbackName ?? t('messages.unknownUser'));
  const preview = conversation?.lastMessage
    ? conversation.lastMessage.kind === 'invite'
      ? t('messages.inviteSummary')
      : conversation.lastMessage.body
    : t('messages.noMessages');

  return (
    <BubbleShell
      name={display.name}
      avatarInitial={display.initial}
      avatarColor={display.color}
      preview={preview}
      hint={t('messages.bubbleOpen')}
      positionClass="bottom-[calc(4.25rem+env(safe-area-inset-bottom))] lg:bottom-6"
      onOpen={onOpen}
      onDismiss={onDismiss}
      dismissLabel={t('messages.bubbleDismiss')}
    />
  );
}

/** Burbuja de mensaje entrante de una conversación que no está en el dock. */
function IncomingBubble({
  dm,
  raise,
  onOpen,
  onDismiss,
}: {
  dm: DmPayload;
  raise: 'none' | 'bubble' | 'panel';
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  // Cada variante define su altura en móvil (sobre la hoja/burbuja/bottom nav) y en escritorio.
  const positionClass =
    raise === 'panel'
      ? 'bottom-[calc(70dvh+0.75rem)] sm:bottom-[33rem]'
      : raise === 'bubble'
        ? 'bottom-[calc(11rem+env(safe-area-inset-bottom))] lg:bottom-[8.5rem]'
        : 'bottom-[calc(4.25rem+env(safe-area-inset-bottom))] lg:bottom-6';
  return (
    <BubbleShell
      name={dm.username ?? '?'}
      avatarInitial={(dm.username ?? '?').charAt(0).toUpperCase()}
      avatarColor="#2f6fe0"
      preview={dm.kind === 'invite' ? t('messages.inviteSummary') : dm.body}
      hint={t('messages.bubbleReply')}
      positionClass={positionClass}
      onOpen={onOpen}
      onDismiss={onDismiss}
      dismissLabel={t('messages.bubbleDismiss')}
    />
  );
}

// ---------------------------------------------------------------------------
// Panel de conversación
// ---------------------------------------------------------------------------

function DockPanel({ conversationId, meId, onMinimize }: { conversationId: string; meId: string; onMinimize: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const fallbackName = useChatDock((s) => s.fallbackName);
  const [body, setBody] = useState('');
  const [live, setLive] = useState<DmPayload[]>([]);
  const [blockedError, setBlockedError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history } = trpc.conversations.listMessages.useQuery({ conversationId });
  const { data: conversations } = trpc.conversations.list.useQuery();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const display = getConversationDisplay(conversation, fallbackName ?? t('messages.unknownUser'));
  const markRead = trpc.conversations.markRead.useMutation();
  const joinMatch = trpc.matches.join.useMutation();

  useEffect(() => {
    markRead.mutate({ conversationId }, { onSuccess: () => void utils.conversations.list.invalidate() });
  }, [conversationId]);

  useEffect(() => {
    return matchSocket.onMessage((message) => {
      if (message.type === 'match.error' && message.payload.code === 'BLOCKED_LANGUAGE') {
        setBlockedError(message.payload.message);
        return;
      }
      if (message.type !== 'dm.message' || message.payload.conversationId !== conversationId) return;
      setLive((prev) => [...prev, message.payload]);
      if (message.payload.userId !== meId) {
        markRead.mutate({ conversationId }, { onSuccess: () => void utils.conversations.list.invalidate() });
      }
    });
  }, [conversationId, meId]);

  const messages = useMemo(() => [...(history ?? []), ...live], [history, live]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  function handleSend(e: FormEvent) {
    e.preventDefault();
    setBlockedError(null);
    const trimmed = body.trim();
    if (!trimmed) return;
    matchSocket.send({ type: 'dm.send', payload: { conversationId, body: trimmed, kind: 'text' } });
    setBody('');
  }

  function handleJoin(code: string) {
    joinMatch.mutate({ code }, { onSuccess: () => void navigate({ to: '/sala/$code', params: { code } }) });
  }

  return (
    // Móvil: hoja anclada al borde inferior a todo el ancho; ≥sm: panel flotante clásico.
    <div className="fixed inset-x-0 bottom-0 z-50 flex h-[70dvh] max-h-[32rem] flex-col overflow-hidden rounded-t-2xl border border-tb-border bg-tb-surface pb-[env(safe-area-inset-bottom)] shadow-xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[30rem] sm:max-h-[70dvh] sm:w-96 sm:rounded-2xl sm:pb-0">
      {/* Cabecera */}
      <div className="flex items-center gap-3 border-b border-tb-border px-4 py-3">
        <Avatar initial={display.initial} color={display.color} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-tb-text">{display.name}</p>
          {display.kind === 'direct' && display.username && (
            <p className="truncate text-xs text-tb-muted">@{display.username}</p>
          )}
          {display.kind === 'group' && display.memberCount !== null && (
            <p className="truncate text-xs text-tb-muted">{t('messages.group.memberCount', { count: display.memberCount })}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onMinimize}
          aria-label={t('messages.close')}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-tb-muted transition-colors hover:bg-tb-surface-2 hover:text-tb-danger"
        >
          <CloseIcon />
        </button>
      </div>

      {display.kind === 'group' && (
        <VoiceCallBar room={{ kind: 'conversation', conversationId }} label={display.name} meId={meId} />
      )}

      {/* Mensajes */}
      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {messages.length === 0 && <p className="pt-6 text-center text-sm text-tb-muted">{t('messages.threadEmpty')}</p>}
        {messages.map((m) => {
          const mine = m.userId === meId;
          if (m.kind === 'invite') {
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className="tb-card max-w-[15rem] rounded-xl border border-tb-border bg-tb-surface-2 p-3">
                  <p className="text-sm font-semibold text-tb-text">{t('messages.inviteReceived')}</p>
                  {!mine && m.inviteMatchCode && (
                    <button
                      type="button"
                      onClick={() => handleJoin(m.inviteMatchCode!)}
                      className="tb-gradient-cta mt-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-tb-accent-fg hover:opacity-90"
                    >
                      {t('messages.joinTable')}
                    </button>
                  )}
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[15rem] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                {!mine && display.kind === 'group' && (
                  <span className="mb-0.5 px-1 text-xs font-semibold text-tb-muted">{m.username}</span>
                )}
                <div
                  className={`rounded-xl px-3 py-1.5 text-sm ${
                    mine ? 'bg-tb-accent text-tb-accent-fg' : 'bg-tb-surface-2 text-tb-text'
                  }`}
                >
                  {m.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composición */}
      {blockedError && <p className="px-3 pt-2 text-xs font-medium text-tb-danger">{blockedError}</p>}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-tb-border p-2.5">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('messages.placeholder')}
          className="min-w-0 flex-1 rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-2 text-sm text-tb-text placeholder:text-tb-muted"
        />
        <button
          type="submit"
          aria-label={t('messages.send')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tb-accent text-tb-accent-fg hover:opacity-90"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
