import { useEffect, useState, type ReactNode } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import { PlusIcon, SearchIcon, UsersIcon } from '../components/icons';
import { useFriendsList } from '../lib/friends';
import { trpc } from '../lib/trpc';
import { useChatDock } from '../stores/chatDock';

/** Espera tras la última pulsación antes de disparar la búsqueda — evita una consulta por tecla. */
const SEARCH_DEBOUNCE_MS = 300;

export const Route = createFileRoute('/_app/social/amigos')({ component: FriendsPage });

type TabKey = 'friends' | 'requests' | 'blocked';

function FriendsPage() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const openChat = useChatDock((s) => s.openChat);
  const [tab, setTab] = useState<TabKey>('friends');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [formMsg, setFormMsg] = useState('');

  const { friends, isLoading: friendsLoading } = useFriendsList();
  const { data: pending } = trpc.friends.listPending.useQuery();
  const { data: blocked } = trpc.friends.listBlocked.useQuery();

  // Espera a que el usuario deje de escribir antes de consultar al servidor.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const { data: searchResults, isFetching: searching } = trpc.friends.search.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 },
  );

  function invalidateAll() {
    void utils.friends.list.invalidate();
    void utils.friends.listPending.invalidate();
    void utils.friends.listBlocked.invalidate();
  }

  const sendRequest = trpc.friends.sendRequest.useMutation({
    onSuccess: (result) => {
      setFormMsg(result.outcome === 'already_friends' ? t('friends.alreadyFriends') : t('friends.requestSent'));
      setQuery('');
      setDebouncedQuery('');
      invalidateAll();
    },
    onError: (err) => setFormMsg(err.message),
  });
  const accept = trpc.friends.accept.useMutation({ onSuccess: invalidateAll });
  const reject = trpc.friends.reject.useMutation({ onSuccess: invalidateAll });
  const cancel = trpc.friends.cancel.useMutation({ onSuccess: invalidateAll });
  const remove = trpc.friends.remove.useMutation({ onSuccess: invalidateAll });
  const block = trpc.friends.block.useMutation({ onSuccess: invalidateAll });
  const unblock = trpc.friends.unblock.useMutation({ onSuccess: invalidateAll });

  const getOrCreateDirect = trpc.conversations.getOrCreateDirect.useMutation({
    onSuccess: () => void utils.conversations.list.invalidate(),
  });

  function statusFor(userId: string): 'friend' | 'outgoing' | 'incoming' | 'blocked' | 'none' {
    if (friends.some((f) => f.userId === userId)) return 'friend';
    if (pending?.outgoing.some((r) => r.profile.userId === userId)) return 'outgoing';
    if (pending?.incoming.some((r) => r.profile.userId === userId)) return 'incoming';
    if (blocked?.some((b) => b.userId === userId)) return 'blocked';
    return 'none';
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'friends', label: t('friends.tabs.friends'), count: friends.length },
    { key: 'requests', label: t('friends.tabs.requests'), count: pending?.incoming.length ?? 0 },
    { key: 'blocked', label: t('friends.tabs.blocked'), count: blocked?.length ?? 0 },
  ];

  return (
    <section className="flex flex-col gap-6">
      <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
        <h2 className="font-display text-base font-bold text-tb-text">{t('friends.addFriend')}</h2>
        <div className="relative mt-3">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tb-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setFormMsg('');
            }}
            placeholder={t('friends.searchPlaceholder')}
            className="w-full rounded-lg border border-tb-border bg-tb-surface py-2 pl-9 pr-3 text-sm text-tb-text outline-none transition-colors focus:border-tb-accent focus:ring-2 focus:ring-tb-accent/30"
          />
        </div>
        {formMsg && <p className="mt-2 text-sm font-medium text-tb-accent">{formMsg}</p>}

        {query.trim().length > 0 && (
          <ul className="mt-3 flex flex-col divide-y divide-tb-border">
            {searching && (!searchResults || searchResults.length === 0) && (
              <li className="py-3 text-sm text-tb-muted">{t('friends.searching')}</li>
            )}
            {!searching && searchResults?.length === 0 && (
              <li className="py-3 text-sm text-tb-muted">{t('friends.noResults')}</li>
            )}
            {searchResults?.map((u) => {
              const status = statusFor(u.userId);
              return (
                <li key={u.userId} className="flex items-center gap-3 py-3">
                  <Avatar initial={u.avatarInitial ?? u.username.charAt(0).toUpperCase()} color={u.avatarColor ?? '#2f6fe0'} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-tb-text">{u.displayName}</p>
                    <p className="text-xs text-tb-muted">@{u.username}</p>
                  </div>
                  {status === 'friend' && <span className="text-xs font-medium text-tb-muted">{t('friends.alreadyFriends')}</span>}
                  {status === 'outgoing' && <span className="text-xs font-medium text-tb-muted">{t('friends.requestSent')}</span>}
                  {status === 'blocked' && <span className="text-xs font-medium text-tb-muted">{t('friends.blockedStatus')}</span>}
                  {status === 'incoming' && (
                    <button
                      type="button"
                      onClick={() => accept.mutate({ userId: u.userId })}
                      className="tb-gradient-cta inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-tb-accent-fg hover:opacity-90"
                    >
                      {t('friends.accept')}
                    </button>
                  )}
                  {status === 'none' && (
                    <button
                      type="button"
                      onClick={() => sendRequest.mutate({ username: u.username })}
                      disabled={sendRequest.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-tb-border px-3 py-1.5 text-xs font-semibold text-tb-text transition-colors hover:border-tb-accent hover:text-tb-accent disabled:opacity-60"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      {t('friends.sendRequest')}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </article>

      <nav aria-label={t('friends.tabsAria')} className="tb-card inline-flex w-fit gap-1 rounded-xl border border-tb-border bg-tb-surface p-1">
        {tabs.map((tabItem) => (
          <button
            key={tabItem.key}
            type="button"
            onClick={() => setTab(tabItem.key)}
            aria-current={tab === tabItem.key ? 'page' : undefined}
            className={
              tab === tabItem.key
                ? 'rounded-lg bg-tb-accent px-3 py-1.5 text-sm font-semibold text-tb-accent-fg transition-colors'
                : 'rounded-lg px-3 py-1.5 text-sm font-medium text-tb-muted transition-colors hover:text-tb-text'
            }
          >
            {tabItem.label} · {tabItem.count}
          </button>
        ))}
      </nav>

      {tab === 'friends' && (
        <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
          {friendsLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-tb-surface-2" />
              ))}
            </div>
          ) : friends.length === 0 ? (
            <EmptyState icon={<UsersIcon />} text={t('friends.empty')} />
          ) : (
            <ul className="flex flex-col divide-y divide-tb-border">
              {friends.map((f) => (
                <li key={f.userId} className="flex items-center gap-3 py-3">
                  <Avatar
                    initial={f.avatarInitial ?? f.username.charAt(0).toUpperCase()}
                    color={f.avatarColor ?? '#2f6fe0'}
                    presence={f.presence === 'in_game' ? 'online' : f.presence}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-tb-text">{f.displayName}</p>
                    <p className="text-xs text-tb-muted">@{f.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      getOrCreateDirect.mutate(
                        { friendId: f.userId },
                        { onSuccess: ({ conversationId }) => openChat(conversationId, f.displayName) },
                      )
                    }
                    className="rounded-lg border border-tb-border bg-tb-surface px-3 py-1.5 text-xs font-semibold text-tb-text transition-colors hover:border-tb-accent hover:text-tb-accent"
                  >
                    {t('friends.message')}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove.mutate({ userId: f.userId })}
                    className="rounded-lg border border-tb-border bg-tb-surface px-3 py-1.5 text-xs font-semibold text-tb-muted transition-colors hover:border-tb-danger hover:text-tb-danger"
                  >
                    {t('friends.remove')}
                  </button>
                  <button
                    type="button"
                    onClick={() => block.mutate({ userId: f.userId })}
                    className="rounded-lg border border-tb-border bg-tb-surface px-3 py-1.5 text-xs font-semibold text-tb-muted transition-colors hover:border-tb-danger hover:text-tb-danger"
                  >
                    {t('friends.block')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      )}

      {tab === 'requests' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
            <h2 className="font-display text-base font-bold text-tb-text">{t('friends.incoming')}</h2>
            {!pending || pending.incoming.length === 0 ? (
              <p className="mt-4 text-sm text-tb-muted">{t('friends.noIncoming')}</p>
            ) : (
              <ul className="mt-4 flex flex-col divide-y divide-tb-border">
                {pending.incoming.map((r) => (
                  <li key={r.profile.userId} className="flex items-center gap-3 py-3">
                    <Avatar initial={r.profile.avatarInitial ?? r.profile.username.charAt(0).toUpperCase()} color={r.profile.avatarColor ?? '#2f6fe0'} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-tb-text">{r.profile.displayName}</p>
                      <p className="text-xs text-tb-muted">{t('friends.wantsToBe')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => reject.mutate({ userId: r.profile.userId })}
                        className="rounded-lg border border-tb-border bg-tb-surface px-3 py-1.5 text-xs font-semibold text-tb-muted hover:border-tb-danger hover:text-tb-danger"
                      >
                        {t('friends.reject')}
                      </button>
                      <button
                        type="button"
                        onClick={() => accept.mutate({ userId: r.profile.userId })}
                        className="tb-gradient-cta rounded-lg px-3 py-1.5 text-xs font-semibold text-tb-accent-fg hover:opacity-90"
                      >
                        {t('friends.accept')}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
            <h2 className="font-display text-base font-bold text-tb-text">{t('friends.outgoing')}</h2>
            {!pending || pending.outgoing.length === 0 ? (
              <p className="mt-4 text-sm text-tb-muted">{t('friends.noOutgoing')}</p>
            ) : (
              <ul className="mt-4 flex flex-col divide-y divide-tb-border">
                {pending.outgoing.map((r) => (
                  <li key={r.profile.userId} className="flex items-center gap-3 py-3">
                    <Avatar initial={r.profile.avatarInitial ?? r.profile.username.charAt(0).toUpperCase()} color={r.profile.avatarColor ?? '#2f6fe0'} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-tb-text">{r.profile.displayName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => cancel.mutate({ userId: r.profile.userId })}
                      className="rounded-lg border border-tb-border bg-tb-surface px-3 py-1.5 text-xs font-semibold text-tb-muted hover:border-tb-danger hover:text-tb-danger"
                    >
                      {t('friends.cancel')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      )}

      {tab === 'blocked' && (
        <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
          {!blocked || blocked.length === 0 ? (
            <p className="text-sm text-tb-muted">{t('friends.noBlocked')}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-tb-border">
              {blocked.map((b) => (
                <li key={b.userId} className="flex items-center gap-3 py-3">
                  <Avatar initial={b.avatarInitial ?? b.username.charAt(0).toUpperCase()} color={b.avatarColor ?? '#2f6fe0'} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-tb-text">{b.displayName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => unblock.mutate({ userId: b.userId })}
                    className="rounded-lg border border-tb-border bg-tb-surface px-3 py-1.5 text-xs font-semibold text-tb-text hover:border-tb-accent hover:text-tb-accent"
                  >
                    {t('friends.unblock')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
      )}
    </section>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center text-tb-muted">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tb-surface-2">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}
