import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { LanguageSelector } from './LanguageSelector';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shell de las páginas públicas (login, registro, recuperación) — sin sidebar. */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-tb-sidebar-bg px-4 py-10">
      <div className="absolute right-4 top-4">
        <LanguageSelector variant="compact" />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo variant="stacked" size={190} />
        </div>
        <div className="tb-card rounded-2xl border border-tb-sidebar-border bg-tb-sidebar-bg-2 p-6">
          <div className="text-center">
            <h1 className="font-display text-xl font-bold text-tb-sidebar-text">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-tb-sidebar-muted">{subtitle}</p>}
          </div>
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-tb-sidebar-muted">{footer}</div>}
      </div>
    </div>
  );
}
