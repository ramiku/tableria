import { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { trpc } from '../lib/trpc';

export const Route = createFileRoute('/_app/admin/mantenimiento')({ component: MaintenancePanel });

function MaintenancePanel() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data } = trpc.admin.settings.get.useQuery();
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setMessage(data.message ?? '');
  }, [data]);

  const setMaintenance = trpc.admin.settings.setMaintenance.useMutation({
    onSuccess: () => {
      setSavedNotice(true);
      void utils.admin.settings.get.invalidate();
    },
  });

  if (!data) return null;

  return (
    <div className="max-w-md rounded-xl border border-tb-border bg-tb-surface p-5">
      <label className="flex items-center gap-2 text-sm font-medium text-tb-text">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        {t('admin.maintenance.enabledLabel')}
      </label>
      <p className="mt-1 text-xs text-tb-muted">{t('admin.maintenance.warning')}</p>

      <label className="mt-4 flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-tb-muted">
        {t('admin.maintenance.messageLabel')}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder={t('admin.maintenance.messagePlaceholder')}
          className="rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-1.5 text-sm text-tb-text placeholder:text-tb-muted"
        />
      </label>

      <button
        type="button"
        disabled={setMaintenance.isPending}
        onClick={() => {
          setSavedNotice(false);
          setMaintenance.mutate({ enabled, message: message.trim() || undefined });
        }}
        className="mt-4 rounded-lg bg-tb-accent px-4 py-2 text-sm font-semibold text-tb-accent-fg disabled:opacity-50"
      >
        {t('admin.maintenance.save')}
      </button>
      {savedNotice && <p className="mt-2 text-sm font-medium text-tb-success">{t('admin.maintenance.saved')}</p>}
    </div>
  );
}
