import { useState, type FormEvent } from 'react';
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { ApiError } from '../lib/api';
import { fetchMe, register } from '../lib/auth';

export const Route = createFileRoute('/registro')({
  beforeLoad: async () => {
    const me = await fetchMe();
    if (me) throw redirect({ to: '/' });
  },
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      await navigate({ to: '/' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.register.genericError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <>
          {t('auth.register.hasAccount')}{' '}
          <Link to="/login" className="font-semibold text-tb-sidebar-accent">
            {t('auth.register.signIn')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          id="username"
          label={t('auth.register.username')}
          type="text"
          autoComplete="username"
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          title={t('auth.register.usernamePattern')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <FormField
          id="email"
          label={t('auth.register.email')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div>
          <FormField
            id="password"
            label={t('auth.register.password')}
            type="password"
            autoComplete="new-password"
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-tb-sidebar-muted">{t('auth.register.passwordHint')}</p>
        </div>
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
          {loading ? t('auth.register.submitting') : t('auth.register.submit')}
        </button>
      </form>
    </AuthLayout>
  );
}
