import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../stores/theme';

export function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? t('theme.toggle.toLight') : t('theme.toggle.toDark')}
      aria-pressed={isDark}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-tb-border text-tb-muted transition-colors hover:border-tb-accent hover:text-tb-accent"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5" />
            <path d="M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5M18.4 18.4l-1.5-1.5M7.1 7.1L5.6 5.6" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
