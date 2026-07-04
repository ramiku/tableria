import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocaleStore, type Locale } from '../stores/i18n';
import { CheckIcon, GlobeIcon } from './icons';

interface LanguageInfo {
  code: Locale;
  nativeName: string;
  region: string;
  flag: ReactNode;
}

function SpainFlag() {
  return (
    <svg
      viewBox="0 0 32 24"
      width={32}
      height={24}
      aria-hidden="true"
      className="block rounded-sm shadow-sm ring-1 ring-black/10"
    >
      <rect width="32" height="24" fill="#AA151B" />
      <rect y="6" width="32" height="12" fill="#F1BF00" />
    </svg>
  );
}

function UkFlag() {
  return (
    <svg
      viewBox="0 0 32 24"
      width={32}
      height={24}
      aria-hidden="true"
      className="block rounded-sm shadow-sm ring-1 ring-black/10"
    >
      <rect width="32" height="24" fill="#012169" />
      <path d="M0,0 L32,24 M32,0 L0,24" stroke="white" strokeWidth="6" />
      <path d="M0,0 L32,24 M32,0 L0,24" stroke="#C8102E" strokeWidth="2.5" />
      <path d="M16,0 V24 M0,12 H32" stroke="white" strokeWidth="8" />
      <path d="M16,0 V24 M0,12 H32" stroke="#C8102E" strokeWidth="4" />
    </svg>
  );
}

const languages: LanguageInfo[] = [
  { code: 'es', nativeName: 'Español', region: 'España', flag: <SpainFlag /> },
  { code: 'en', nativeName: 'English', region: 'United States', flag: <UkFlag /> },
];

interface CardsProps {
  variant: 'cards';
}

interface CompactProps {
  variant: 'compact';
}

export function LanguageSelector(props: CardsProps | CompactProps) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  if (props.variant === 'cards') {
    return (
      <div
        role="radiogroup"
        aria-label={t('app.language')}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {languages.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <button
              key={lang.code}
              role="radio"
              aria-checked={isActive}
              onClick={() => setLocale(lang.code)}
              className={
                isActive
                  ? 'tb-card relative flex items-center gap-4 rounded-xl border-2 border-tb-accent bg-tb-accent-tint p-4 text-left transition-all hover:-translate-y-0.5'
                  : 'tb-card relative flex items-center gap-4 rounded-xl border border-tb-border bg-tb-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-tb-accent'
              }
            >
              <span className="shrink-0">{lang.flag}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-display text-base font-bold text-tb-text">
                  {lang.nativeName}
                </span>
                <span className="text-xs text-tb-muted">{lang.region}</span>
              </span>
              <span
                className={
                  isActive
                    ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tb-accent text-tb-accent-fg'
                    : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-tb-border text-transparent'
                }
              >
                <CheckIcon />
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact: pensado para AuthLayout (franja de marca fija, siempre oscura)
  return (
    <div
      role="radiogroup"
      aria-label={t('app.language')}
      className="inline-flex gap-1 rounded-full border border-tb-sidebar-border bg-tb-sidebar-bg-2 p-1"
    >
      {languages.map((lang) => {
        const isActive = locale === lang.code;
        return (
          <button
            key={lang.code}
            role="radio"
            aria-checked={isActive}
            aria-label={lang.nativeName}
            onClick={() => setLocale(lang.code)}
            className={
              isActive
                ? 'flex items-center gap-1.5 rounded-full bg-tb-sidebar-accent px-3 py-1 text-xs font-bold text-white transition-colors'
                : 'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-tb-sidebar-muted transition-colors hover:text-tb-sidebar-text'
            }
          >
            <span className="block h-3 w-4 overflow-hidden rounded-sm ring-1 ring-white/10">
              {lang.flag}
            </span>
            <span>{lang.code.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Tarjeta completa de selección de idioma (para la pestaña Cuenta del perfil). */
export function LanguageSection() {
  const { t } = useTranslation();
  return (
    <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
      <header className="mb-1 flex items-center gap-2">
        <GlobeIcon />
        <h2 className="font-display text-base font-bold text-tb-text">
          {t('profile.language.section')}
        </h2>
      </header>
      <p className="mb-4 text-sm text-tb-muted">{t('profile.language.helper')}</p>
      <LanguageSelector variant="cards" />
    </article>
  );
}