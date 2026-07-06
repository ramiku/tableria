import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { trpc } from '../../lib/trpc';

function ChatModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[70vh] w-full max-w-md flex-col rounded-2xl bg-tb-surface p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-tb-text">{title}</h3>
          <button type="button" onClick={onClose} className="text-sm text-tb-muted hover:text-tb-text">
            {t('admin.matchChat.close')}
          </button>
        </div>
        <div className="mt-3 flex-1 space-y-2 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function MatchChatModal({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { data } = trpc.admin.matchChat.get.useQuery({ matchId });

  return (
    <ChatModalShell title={t('admin.matchChat.title')} onClose={onClose}>
      {!data || data.length === 0 ? (
        <p className="text-sm text-tb-muted">{t('admin.matchChat.empty')}</p>
      ) : (
        data.map((m) => (
          <p key={m.id} className="text-sm text-tb-text">
            <span className="font-semibold">{m.username}:</span> {m.body}
          </p>
        ))
      )}
    </ChatModalShell>
  );
}

export function DirectChatModal({ conversationId, onClose }: { conversationId: string; onClose: () => void }) {
  const { t } = useTranslation();
  const { data } = trpc.admin.directChat.get.useQuery({ conversationId });

  return (
    <ChatModalShell title={t('admin.directChat.title')} onClose={onClose}>
      {!data || data.length === 0 ? (
        <p className="text-sm text-tb-muted">{t('admin.directChat.empty')}</p>
      ) : (
        data.map((m) => (
          <p key={m.id} className="text-sm text-tb-text">
            <span className="font-semibold">{m.username ?? t('messages.unknownUser')}:</span> {m.body}
          </p>
        ))
      )}
    </ChatModalShell>
  );
}
