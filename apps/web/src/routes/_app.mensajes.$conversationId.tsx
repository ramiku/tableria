import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { ServerMessage } from '@tableria/protocol';
import { Avatar } from '../components/Avatar';
import { ArrowLeftIcon, SendIcon } from '../components/icons';
import { matchSocket } from '../lib/ws';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/mensajes/$conversationId')({ component: ThreadPage });

type DmMessage = Extract<ServerMessage, { type: 'dm.message' }>['payload'];

function ThreadPage() {
  const { t } = useTranslation();
  const { conversationId } = Route.useParams();
  const { me } = Route.useRouteContext();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [body, setBody] = useState('');
  const [live, setLive] = useState<DmMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: history } = trpc.conversations.listMessages.useQuery({ conversationId });
  const { data: conversations } = trpc.conversations.list.useQuery();
  const conversation = conversations?.find((c) => c.id === conversationId);
  const markRead = trpc.conversations.markRead.useMutation();
  const joinMatch = trpc.matches.join.useMutation();

  useEffect(() => {
    setLive([]);
    markRead.mutate({ conversationId }, { onSuccess: () => void utils.conversations.list.invalidate() });
  }, [conversationId]);

  useEffect(() => {
    return matchSocket.onMessage((message) => {
      if (message.type !== 'dm.message' || message.payload.conversationId !== conversationId) return;
      setLive((prev) => [...prev, message.payload]);
      markRead.mutate({ conversationId }, { onSuccess: () => void utils.conversations.list.invalidate() });
    });
  }, [conversationId]);

  const messages = useMemo(() => [...(history ?? []), ...live], [history, live]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    matchSocket.send({ type: 'dm.send', payload: { conversationId, body: trimmed, kind: 'text' } });
    setBody('');
  }

  function handleJoin(code: string) {
    joinMatch.mutate({ code }, { onSuccess: () => void navigate({ to: '/sala/$code', params: { code } }) });
  }

  return (
    <>
      {/* Cabecera del hilo */}
      <div className="flex items-center gap-3 border-b border-tb-border px-4 py-3">
        <Link
          to="/mensajes"
          aria-label={t('messages.back')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-tb-muted hover:bg-tb-surface-2 hover:text-tb-text md:hidden"
        >
          <ArrowLeftIcon />
        </Link>
        <Avatar
          initial={conversation?.otherUser?.avatarInitial ?? conversation?.otherUser?.username.charAt(0).toUpperCase() ?? '?'}
          color={conversation?.otherUser?.avatarColor ?? '#2f6fe0'}
          size={36}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-tb-text">
            {conversation?.otherUser?.displayName ?? t('messages.unknownUser')}
          </p>
          {conversation?.otherUser && <p className="truncate text-xs text-tb-muted">@{conversation.otherUser.username}</p>}
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && <p className="text-center text-sm text-tb-muted">{t('messages.threadEmpty')}</p>}
        {messages.map((m) => {
          const mine = m.userId === me.id;
          if (m.kind === 'invite') {
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className="tb-card max-w-xs rounded-xl border border-tb-border bg-tb-surface-2 p-3">
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
              <div
                className={`max-w-xs rounded-xl px-3 py-2 text-sm ${
                  mine ? 'bg-tb-accent text-tb-accent-fg' : 'bg-tb-surface-2 text-tb-text'
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composición */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-tb-border p-3">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('messages.placeholder')}
          className="flex-1 rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-2 text-sm text-tb-text placeholder:text-tb-muted"
        />
        <button
          type="submit"
          aria-label={t('messages.send')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tb-accent text-tb-accent-fg hover:opacity-90"
        >
          <SendIcon />
        </button>
      </form>
    </>
  );
}
