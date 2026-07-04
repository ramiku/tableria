import { useState, type FormEvent } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { ApiError } from '../lib/api';
import { resetPassword } from '../lib/auth';

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute('/restablecer')({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError(t('auth.reset.mismatch'));
      return;
    }
    if (!token) {
      setError(t('auth.reset.invalidTitle'));
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      await navigate({ to: '/login' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.reset.genericError'));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout title={t('auth.reset.invalidTitle')} subtitle={t('auth.reset.invalidBody')}>
        <Link to="/recuperar" className="text-sm font-semibold text-tb-sidebar-accent">
          {t('auth.reset.invalidCta')}
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t('auth.reset.title')} subtitle={t('auth.reset.subtitle')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          id="password"
          label={t('auth.reset.password')}
          type="password"
          autoComplete="new-password"
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <FormField
          id="confirm"
          label={t('auth.reset.confirm')}
          type="password"
          autoComplete="new-password"
          minLength={10}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="text-sm text-tb-sidebar-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="tb-gradient-sidebar-cta rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t('auth.reset.submitting') : t('auth.reset.submit')}
        </button>
      </form>
    </AuthLayout>
  );
}
