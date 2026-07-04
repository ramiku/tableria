import { useState, type FormEvent } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { forgotPassword } from '../lib/auth';

export const Route = createFileRoute('/recuperar')({ component: ForgotPasswordPage });

function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
    } finally {
      // Siempre mostramos el mismo mensaje, exista o no la cuenta.
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title={t('auth.forgot.sentTitle')}
        subtitle={t('auth.forgot.sentBody')}
      >
        <Link to="/login" className="text-sm font-semibold text-tb-sidebar-accent">
          {t('auth.forgot.backToSignIn')}
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.forgot.title')}
      subtitle={t('auth.forgot.subtitle')}
      footer={
        <Link to="/login" className="font-semibold text-tb-sidebar-accent">
          {t('auth.forgot.backToSignIn')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          id="email"
          label={t('auth.forgot.email')}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="tb-gradient-sidebar-cta rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
        </button>
      </form>
    </AuthLayout>
  );
}
