import { useState, type FormEvent } from 'react';
import { Link, createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { ApiError } from '../lib/api';
import { fetchMe, login, verifyTwoFactor } from '../lib/auth';

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const me = await fetchMe();
    if (me) throw redirect({ to: '/' });
  },
  component: LoginPage,
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(identifier, password);
      if ('requiresTwoFactor' in result) {
        setChallengeToken(result.challengeToken);
      } else {
        await navigate({ to: '/' });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.login.genericError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    if (!challengeToken) return;
    setError('');
    setLoading(true);
    try {
      await verifyTwoFactor(challengeToken, code, trustDevice);
      await navigate({ to: '/' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.login.genericError'));
    } finally {
      setLoading(false);
    }
  }

  if (challengeToken) {
    return (
      <AuthLayout title={t('auth.twoFactor.title')} subtitle={t('auth.twoFactor.subtitle')}>
        <form onSubmit={handleVerifyCode} className="flex flex-col gap-4" noValidate>
          <FormField
            id="two-factor-code"
            label={t('auth.twoFactor.code')}
            type="text"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <label className="flex items-center gap-2 text-sm text-tb-sidebar-muted">
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="h-4 w-4 accent-tb-sidebar-accent"
            />
            {t('auth.twoFactor.trustDevice')}
          </label>
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
            {loading ? t('auth.login.submitting') : t('auth.twoFactor.submit')}
          </button>
          <button
            type="button"
            onClick={() => {
              setChallengeToken(null);
              setCode('');
              setError('');
            }}
            className="text-center text-sm text-tb-sidebar-muted transition-colors hover:text-tb-sidebar-accent"
          >
            {t('auth.twoFactor.back')}
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          {t('auth.login.noAccount')}{' '}
          <Link to="/registro" className="font-semibold text-tb-sidebar-accent">
            {t('auth.login.register')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          id="login-identifier"
          label={t('auth.login.identifier')}
          type="text"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <FormField
          id="login-password"
          label={t('auth.login.password')}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          {loading ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>
        <Link
          to="/recuperar"
          className="text-center text-sm text-tb-sidebar-muted transition-colors hover:text-tb-sidebar-accent"
        >
          {t('auth.login.forgot')}
        </Link>
        <Link
          to="/entrar"
          className="text-center text-sm text-tb-sidebar-muted transition-colors hover:text-tb-sidebar-accent"
        >
          {t('auth.login.magicLink')}
        </Link>
      </form>
    </AuthLayout>
  );
}
