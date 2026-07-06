import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { DirectChatModal, MatchChatModal } from '../components/admin/ChatModals';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/admin/jugadores')({ component: PlayersPage });

function PlayersPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const search = trpc.admin.players.search.useQuery({ query: submittedQuery }, { enabled: submittedQuery.length > 0 });

  if (selectedId) {
    return <PlayerDetail userId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmittedQuery(query.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('admin.players.searchPlaceholder')}
          className="flex-1 rounded-lg border border-tb-border bg-tb-surface px-3 py-2 text-sm text-tb-text placeholder:text-tb-muted"
        />
        <button type="submit" className="tb-gradient-cta rounded-lg px-4 py-2 text-sm font-semibold text-tb-accent-fg">
          {t('admin.players.search')}
        </button>
      </form>

      {search.data && (
        <div className="mt-4 overflow-hidden rounded-xl border border-tb-border">
          {search.data.length === 0 ? (
            <p className="p-4 text-sm text-tb-muted">{t('admin.players.noResults')}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-tb-surface-2 text-xs uppercase tracking-wide text-tb-muted">
                <tr>
                  <th className="px-4 py-2 font-semibold">{t('profile.account.fields.username')}</th>
                  <th className="px-4 py-2 font-semibold">{t('profile.account.fields.email')}</th>
                  <th className="px-4 py-2 font-semibold">{t('admin.players.reputation')}</th>
                  <th className="px-4 py-2 font-semibold">{t('admin.players.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tb-border">
                {search.data.map((u) => (
                  <tr
                    key={u.id}
                    className="cursor-pointer hover:bg-tb-surface-2"
                    onClick={() => setSelectedId(u.id)}
                  >
                    <td className="px-4 py-2 font-medium text-tb-text">{u.username}</td>
                    <td className="px-4 py-2 text-tb-muted">{u.email}</td>
                    <td className="px-4 py-2 text-tb-text">{u.reputation}</td>
                    <td className="px-4 py-2">
                      {u.disabledAt ? (
                        <span className="rounded-full bg-tb-danger/10 px-2 py-0.5 text-xs font-semibold text-tb-danger">
                          {t('admin.players.statusBanned')}
                        </span>
                      ) : (
                        <span className="rounded-full bg-tb-success/10 px-2 py-0.5 text-xs font-semibold text-tb-success">
                          {t('admin.players.statusActive')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerDetail({ userId, onBack }: { userId: string; onBack: () => void }) {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data: player } = trpc.admin.players.get.useQuery({ userId });
  const [reputationValue, setReputationValue] = useState<number | null>(null);
  const [reputationReason, setReputationReason] = useState('');
  const [banReason, setBanReason] = useState('');

  const setReputation = trpc.admin.players.setReputation.useMutation({
    onSuccess: () => {
      setReputationReason('');
      void utils.admin.players.get.invalidate({ userId });
    },
  });
  const ban = trpc.admin.players.ban.useMutation({
    onSuccess: () => {
      setBanReason('');
      void utils.admin.players.get.invalidate({ userId });
    },
  });
  const unban = trpc.admin.players.unban.useMutation({
    onSuccess: () => void utils.admin.players.get.invalidate({ userId }),
  });
  const { data: chats } = trpc.admin.players.chats.useQuery({ userId });
  const [openMatchChatId, setOpenMatchChatId] = useState<string | null>(null);
  const [openConversationId, setOpenConversationId] = useState<string | null>(null);

  if (!player) return null;

  return (
    <div className="flex flex-col gap-6">
      <button type="button" onClick={onBack} className="self-start text-sm font-semibold text-tb-accent hover:underline">
        ← {t('admin.players.back')}
      </button>

      <div className="rounded-xl border border-tb-border bg-tb-surface p-5">
        <h2 className="font-display text-lg font-bold text-tb-text">{player.displayName}</h2>
        <p className="text-sm text-tb-muted">@{player.username} · {player.email}</p>
        {player.disabledAt && (
          <p className="mt-2 text-sm font-medium text-tb-danger">
            {t('admin.players.bannedNotice', { reason: player.disabledReason ?? '' })}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-tb-muted">
            {t('admin.players.reputation')}
            <input
              type="number"
              min={1}
              max={100}
              value={reputationValue ?? player.reputation}
              onChange={(e) => setReputationValue(Number(e.target.value))}
              className="w-20 rounded-lg border border-tb-border bg-tb-surface-2 px-2 py-1.5 text-sm text-tb-text"
            />
          </label>
          <input
            value={reputationReason}
            onChange={(e) => setReputationReason(e.target.value)}
            placeholder={t('admin.players.reputationReasonPlaceholder')}
            className="min-w-56 flex-1 rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text placeholder:text-tb-muted"
          />
          <button
            type="button"
            disabled={!reputationReason.trim() || setReputation.isPending}
            onClick={() =>
              setReputation.mutate({ userId, value: reputationValue ?? player.reputation, reason: reputationReason.trim() })
            }
            className="rounded-lg bg-tb-accent px-3 py-1.5 text-sm font-semibold text-tb-accent-fg disabled:opacity-50"
          >
            {t('admin.players.reputationSave')}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {player.disabledAt ? (
            <button
              type="button"
              onClick={() => unban.mutate({ userId })}
              disabled={unban.isPending}
              className="rounded-lg border border-tb-border px-3 py-1.5 text-sm font-semibold text-tb-text hover:bg-tb-surface-2"
            >
              {t('admin.players.unban')}
            </button>
          ) : (
            <>
              <input
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder={t('admin.players.banReasonPlaceholder')}
                className="min-w-56 flex-1 rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text placeholder:text-tb-muted"
              />
              <button
                type="button"
                disabled={!banReason.trim() || ban.isPending}
                onClick={() => ban.mutate({ userId, reason: banReason.trim() })}
                className="rounded-lg bg-tb-danger px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {t('admin.players.ban')}
              </button>
            </>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-tb-muted">
          {t('admin.players.recentMatches')}
        </h3>
        {player.recentMatches.length === 0 ? (
          <p className="mt-2 text-sm text-tb-muted">{t('admin.players.noMatches')}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {player.recentMatches.map((m) => (
              <li key={m.id} className="flex items-center justify-between rounded-lg border border-tb-border px-3 py-2 text-sm">
                <span className="text-tb-text">{m.gameId}</span>
                <span className="text-tb-muted">{m.state}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-tb-muted">
          {t('admin.players.chatsTitle')}
        </h3>

        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-tb-muted">
          {t('admin.players.tableChats')}
        </p>
        {!chats || chats.matchChats.length === 0 ? (
          <p className="mt-1 text-sm text-tb-muted">{t('admin.players.noChats')}</p>
        ) : (
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {chats.matchChats.map((c) => (
              <li
                key={c.matchId}
                className="flex items-center justify-between rounded-lg border border-tb-border px-3 py-2 text-sm"
              >
                <span className="text-tb-text">{c.gameId}</span>
                <span className="text-tb-muted">{t('admin.players.messages', { count: c.messageCount })}</span>
                <button
                  type="button"
                  onClick={() => setOpenMatchChatId(c.matchId)}
                  className="text-xs font-semibold text-tb-accent hover:underline"
                >
                  {t('admin.players.viewChat')}
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-tb-muted">
          {t('admin.players.directChats')}
        </p>
        {!chats || chats.directChats.length === 0 ? (
          <p className="mt-1 text-sm text-tb-muted">{t('admin.players.noChats')}</p>
        ) : (
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {chats.directChats.map((c) => (
              <li
                key={c.conversationId}
                className="flex items-center justify-between rounded-lg border border-tb-border px-3 py-2 text-sm"
              >
                <span className="text-tb-text">{c.otherUser?.username ?? t('messages.unknownUser')}</span>
                <button
                  type="button"
                  onClick={() => setOpenConversationId(c.conversationId)}
                  className="text-xs font-semibold text-tb-accent hover:underline"
                >
                  {t('admin.players.viewChat')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {openMatchChatId && <MatchChatModal matchId={openMatchChatId} onClose={() => setOpenMatchChatId(null)} />}
      {openConversationId && (
        <DirectChatModal conversationId={openConversationId} onClose={() => setOpenConversationId(null)} />
      )}
    </div>
  );
}
