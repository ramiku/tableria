import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { RichTextEditor } from '../components/RichTextEditor';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/admin/juegos/$slug')({ component: AdminGameEdit });

interface FormState {
  name: string;
  description: string;
  badge: string;
  coverBg: string;
  coverFg: string;
  minPlayers: number;
  maxPlayers: number;
  durationMin: number;
  isActive: boolean;
}

function AdminGameEdit() {
  const { t } = useTranslation();
  const { slug } = Route.useParams();
  const utils = trpc.useUtils();
  const { data: game } = trpc.admin.games.get.useQuery({ slug });

  const [form, setForm] = useState<FormState | null>(null);
  const [rulesHtml, setRulesHtml] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!game) return;
    setForm({
      name: game.name,
      description: game.description ?? '',
      badge: game.badge ?? '',
      coverBg: game.coverBg ?? '',
      coverFg: game.coverFg ?? '',
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
      durationMin: game.durationMin ?? 15,
      isActive: game.isActive,
    });
    setRulesHtml(game.rulesHtml);
  }, [game]);

  const update = trpc.admin.games.update.useMutation({
    onSuccess: () => {
      setSavedNotice(t('admin.games.form.saved'));
      void utils.admin.games.get.invalidate({ slug });
      void utils.admin.games.list.invalidate();
    },
  });
  const updateRules = trpc.admin.games.updateRules.useMutation({
    onSuccess: () => setSavedNotice(t('admin.games.rules.saved')),
  });

  if (!form || rulesHtml === null) return null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-tb-border bg-tb-surface p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-tb-muted">
            {t('admin.games.form.name')}
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-tb-muted">
            {t('admin.games.form.badge')}
            <input
              value={form.badge}
              onChange={(e) => set('badge', e.target.value)}
              className="rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text"
            />
          </label>

          <label className="col-span-full flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-tb-muted">
            {t('admin.games.form.description')}
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-tb-muted">
            {t('admin.games.form.coverBg')}
            <input
              type="color"
              value={form.coverBg || '#2f6fe0'}
              onChange={(e) => set('coverBg', e.target.value)}
              className="h-9 w-full rounded-lg border border-tb-border bg-tb-surface-2 px-1"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-tb-muted">
            {t('admin.games.form.coverFg')}
            <input
              type="color"
              value={form.coverFg || '#ffffff'}
              onChange={(e) => set('coverFg', e.target.value)}
              className="h-9 w-full rounded-lg border border-tb-border bg-tb-surface-2 px-1"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-tb-muted">
            {t('admin.games.form.minPlayers')}
            <input
              type="number"
              min={1}
              max={16}
              value={form.minPlayers}
              onChange={(e) => set('minPlayers', Number(e.target.value))}
              className="rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-tb-muted">
            {t('admin.games.form.maxPlayers')}
            <input
              type="number"
              min={1}
              max={16}
              value={form.maxPlayers}
              onChange={(e) => set('maxPlayers', Number(e.target.value))}
              className="rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-tb-muted">
            {t('admin.games.form.durationMin')}
            <input
              type="number"
              min={1}
              max={600}
              value={form.durationMin}
              onChange={(e) => set('durationMin', Number(e.target.value))}
              className="rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-tb-text">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
            {t('admin.games.form.isActive')}
          </label>
        </div>

        <button
          type="button"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({
              slug,
              name: form.name,
              description: form.description || undefined,
              badge: form.badge || undefined,
              coverBg: form.coverBg || undefined,
              coverFg: form.coverFg || undefined,
              minPlayers: form.minPlayers,
              maxPlayers: form.maxPlayers,
              durationMin: form.durationMin,
              isActive: form.isActive,
            })
          }
          className="mt-4 rounded-lg bg-tb-accent px-4 py-2 text-sm font-semibold text-tb-accent-fg disabled:opacity-50"
        >
          {t('admin.games.form.save')}
        </button>
      </div>

      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-tb-muted">
          {t('admin.games.rules.title')}
        </h3>
        <div className="mt-2">
          <RichTextEditor value={rulesHtml} onChange={setRulesHtml} />
        </div>
        <button
          type="button"
          disabled={updateRules.isPending}
          onClick={() => updateRules.mutate({ slug, html: rulesHtml })}
          className="mt-3 rounded-lg bg-tb-accent px-4 py-2 text-sm font-semibold text-tb-accent-fg disabled:opacity-50"
        >
          {t('admin.games.rules.save')}
        </button>
      </div>

      {savedNotice && <p className="text-sm font-medium text-tb-success">{savedNotice}</p>}
    </div>
  );
}
