import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, LinkIcon } from './icons';

export function InviteCard() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: no hay nada más que hacer aquí.
    }
  }

  return (
    <div className="tb-gradient-cta rounded-xl p-4 text-white">
      <p className="font-display text-sm font-bold">{t('invite.title')}</p>
      <p className="mt-1 text-xs text-white/80">{t('invite.body')}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold transition-colors hover:bg-white/25"
      >
        {copied ? <CheckIcon /> : <LinkIcon />}
        {copied ? t('invite.copied') : t('invite.copy')}
      </button>
    </div>
  );
}
