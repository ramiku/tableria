import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFriendsList } from '../lib/friends';
import { trpc } from '../lib/trpc';
import { Avatar } from './Avatar';

export function GroupCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (conversationId: string, name: string) => void;
}) {
  const { t } = useTranslation();
  const { friends } = useFriendsList();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const createGroup = trpc.conversations.createGroup.useMutation({
    onSuccess: ({ conversationId }) => onCreated(conversationId, name.trim()),
  });

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-sm flex-col rounded-2xl bg-tb-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-base font-bold text-tb-text">{t('messages.group.createTitle')}</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('messages.group.namePlaceholder')}
          className="mt-3 rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-2 text-sm text-tb-text placeholder:text-tb-muted"
        />

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-tb-muted">
          {t('messages.group.selectFriends')}
        </p>
        <div className="mt-2 flex-1 space-y-1 overflow-y-auto">
          {friends.length === 0 ? (
            <p className="text-sm text-tb-muted">{t('friends.empty')}</p>
          ) : (
            friends.map((f) => (
              <label
                key={f.userId}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-tb-surface-2"
              >
                <input
                  type="checkbox"
                  checked={selected.has(f.userId)}
                  onChange={() => toggle(f.userId)}
                  className="h-4 w-4 accent-tb-accent"
                />
                <Avatar initial={f.avatarInitial ?? f.username.charAt(0).toUpperCase()} color={f.avatarColor ?? '#2f6fe0'} size={28} />
                <span className="text-sm text-tb-text">{f.displayName}</span>
              </label>
            ))
          )}
        </div>

        {createGroup.isError && <p className="mt-2 text-xs font-medium text-tb-danger">{createGroup.error.message}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm text-tb-muted hover:text-tb-text">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={!name.trim() || selected.size === 0 || createGroup.isPending}
            onClick={() => createGroup.mutate({ name: name.trim(), memberIds: [...selected] })}
            className="tb-gradient-cta rounded-lg px-4 py-2 text-sm font-semibold text-tb-accent-fg disabled:opacity-50"
          >
            {t('messages.group.create')}
          </button>
        </div>
      </div>
    </div>
  );
}
