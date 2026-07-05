import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { ApiError } from '../lib/api';
import { consumeMagicLink, requestMagicLink } from '../lib/auth';

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute('/entrar')({
  validateSearch: searchSchema,
  component: MagicLinkPage,
});

function ConsumeToken({ token }: { token: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    consumeMagicLink(token)
      .then(() => navigate({ to: '/' }))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : t('auth.magicLink.genericError')));
  }, [token, navigate, t]);

  if (error) {
    return (
      <AuthLayout title={t('auth.magicLink.invalidTitle')} subtitle={error}>
        <Link to="/login" className="text-sm font-semibold text-tb-sidebar-accent">
          {t('auth.forgot.backToSignIn')}
        </Link>
      </AuthLayout>
    );
  }

  return <AuthLayout title={t('auth.magicLink.consuming')} subtitle={t('auth.magicLink.consumingBody')}>{null}</AuthLayout>;
}

function MagicLinkPage() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();
  const [identifier, setIdentifier] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (token) return <ConsumeToken token={token} />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestMagicLink(identifier);
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <AuthLayout title={t('auth.magicLink.sentTitle')} subtitle={t('auth.magicLink.sentBody')}>
        <Link to="/login" className="text-sm font-semibold text-tb-sidebar-accent">
          {t('auth.forgot.backToSignIn')}
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.magicLink.title')}
      subtitle={t('auth.magicLink.subtitle')}
      footer={
        <Link to="/login" className="font-semibold text-tb-sidebar-accent">
          {t('auth.forgot.backToSignIn')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          id="magic-identifier"
          label={t('auth.login.identifier')}
          type="text"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="tb-gradient-sidebar-cta rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t('auth.login.submitting') : t('auth.magicLink.submit')}
        </button>
      </form>
    </AuthLayout>
  );
}
