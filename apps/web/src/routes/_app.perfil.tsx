import { useEffect, useState, type FormEvent } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import {
  CalendarIcon,
  CheckIcon,
  KeyIcon,
  MedalIcon,
  PencilIcon,
  ShieldIcon,
  StarIcon,
} from '../components/icons';
import { LanguageSection } from '../components/LanguageSelector';
import { ApiError } from '../lib/api';
import {
  disableTwoFactor,
  enableTwoFactor,
  listTrustedDevices,
  revokeAllTrustedDevices,
  revokeTrustedDevice,
  setupTwoFactor,
  type TrustedDevice,
  type TwoFactorSetup,
} from '../lib/auth';
import { useFriendsList } from '../lib/friends';
import { trpc } from '../lib/trpc';
import { useLocaleStore } from '../stores/i18n';

export const Route = createFileRoute('/_app/perfil')({ component: ProfilePage });

type TabKey = 'account' | 'friends' | 'matches' | 'achievements';
const tabs: TabKey[] = ['account', 'friends', 'matches', 'achievements'];

// --- Datos demo de logros (M4 solo sirve estadísticas/partidas reales; los logros quedan para más adelante) ---

type MatchResult = 'win' | 'loss' | 'draw';

const demoAchievements: { id: string; nameKey: string; descKey: string; unlocked: boolean }[] = [
  { id: 'a1', nameKey: 'firstGame', descKey: 'firstGame', unlocked: true },
  { id: 'a2', nameKey: 'winStreak3', descKey: 'winStreak3', unlocked: true },
  { id: 'a3', nameKey: 'ticTacToeMaster', descKey: 'ticTacToeMaster', unlocked: true },
  { id: 'a4', nameKey: 'social', descKey: 'social', unlocked: true },
  { id: 'a5', nameKey: 'invincible', descKey: 'invincible', unlocked: false },
  { id: 'a6', nameKey: 'collector', descKey: 'collector', unlocked: false },
  { id: 'a7', nameKey: 'tournament', descKey: 'tournament', unlocked: false },
  { id: 'a8', nameKey: 'legend', descKey: 'legend', unlocked: false },
];

const memberSince = new Date(2026, 0, 12); // 12 ene 2026 — dato demo

function formatMemberSince(date: Date, locale: string) {
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

const resultStyles: Record<MatchResult, { dot: string; text: string; bg: string }> = {
  win: { dot: 'bg-tb-success', text: 'text-tb-success', bg: 'bg-tb-accent-tint' },
  loss: { dot: 'bg-tb-danger', text: 'text-tb-danger', bg: 'bg-tb-surface-2' },
  draw: { dot: 'bg-tb-muted', text: 'text-tb-muted', bg: 'bg-tb-surface-2' },
};

function ProfilePage() {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const { me } = Route.useRouteContext();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('account');

  // Form local de contraseña (no se envía aún — placeholder M1)
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwdMsg('');
    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdMsg(t('profile.language.validation.required'));
      return;
    }
    if (newPwd.length < 8) {
      setPwdMsg(t('profile.language.validation.minLength'));
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg(t('profile.language.validation.mismatch'));
      return;
    }
    setPwdMsg(t('profile.language.validation.updated'));
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
  }

  const memberSinceLabel = formatMemberSince(memberSince, locale);

  return (
    <section className="flex flex-col gap-6">
      {/* Cabecera de perfil */}
      <header className="tb-card flex flex-col gap-5 rounded-2xl border border-tb-border bg-tb-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <Avatar
            initial={me.avatarInitial ?? me.username.charAt(0).toUpperCase()}
            color={me.avatarColor ?? '#2f6fe0'}
            presence="online"
            size={72}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">
              {t('profile.title')}
            </p>
            <h1 className="font-display text-2xl font-extrabold text-tb-text">{me.displayName}</h1>
            <p className="mt-0.5 text-sm text-tb-muted">@{me.username}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tb-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-tb-success" aria-hidden="true" />
                {t('profile.statusOnline')}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarIcon />
                {t('profile.memberSince', { date: memberSinceLabel })}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate({ to: '/' })}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-tb-border bg-tb-surface px-3 py-2 text-sm font-semibold text-tb-text transition-colors hover:border-tb-accent hover:text-tb-accent sm:self-auto"
        >
          <PencilIcon />
          {t('common.soon')}
        </button>
      </header>

      {/* Tabs */}
      <nav
        aria-label={t('profile.tabsAria')}
        className="tb-card inline-flex w-fit gap-1 rounded-xl border border-tb-border bg-tb-surface p-1"
      >
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-current={tab === key ? 'page' : undefined}
            className={
              tab === key
                ? 'rounded-lg bg-tb-accent px-3 py-1.5 text-sm font-semibold text-tb-accent-fg transition-colors'
                : 'rounded-lg px-3 py-1.5 text-sm font-medium text-tb-muted transition-colors hover:text-tb-text'
            }
          >
            {t(`profile.tabs.${key}`)}
          </button>
        ))}
      </nav>

      {/* Contenido por pestaña */}
      {tab === 'account' && (
        <AccountTab
          me={me}
          currentPwd={currentPwd}
          newPwd={newPwd}
          confirmPwd={confirmPwd}
          pwdMsg={pwdMsg}
          memberSinceLabel={memberSinceLabel}
          onCurrentPwd={setCurrentPwd}
          onNewPwd={setNewPwd}
          onConfirmPwd={setConfirmPwd}
          onSubmit={handleChangePassword}
        />
      )}

      {tab === 'friends' && <FriendsTab />}

      {tab === 'matches' && <MatchesTab />}

      {tab === 'achievements' && <AchievementsTab />}
    </section>
  );
}

interface AccountTabProps {
  me: { username: string; displayName: string; email: string; twoFactorEnabled: boolean };
  currentPwd: string;
  newPwd: string;
  confirmPwd: string;
  pwdMsg: string;
  memberSinceLabel: string;
  onCurrentPwd: (v: string) => void;
  onNewPwd: (v: string) => void;
  onConfirmPwd: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
}

function AccountTab(props: AccountTabProps) {
  const { t } = useTranslation();
  const { me, currentPwd, newPwd, confirmPwd, pwdMsg, memberSinceLabel, onCurrentPwd, onNewPwd, onConfirmPwd, onSubmit } = props;
  return (
    <div className="flex flex-col gap-6">
      {/* Identidad — fila completa, info de solo lectura */}
      <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
        <header className="mb-4 flex items-center gap-2">
          <ShieldIcon />
          <h2 className="font-display text-base font-bold text-tb-text">
            {t('profile.account.identity')}
          </h2>
        </header>
        <dl className="grid grid-cols-1 divide-y divide-tb-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="sm:pr-6">
            <Row label={t('profile.account.fields.username')} value={`@${me.username}`} />
            <Row label={t('profile.account.fields.displayName')} value={me.displayName} />
          </div>
          <div className="sm:pl-6">
            <Row label={t('profile.account.fields.email')} value={me.email} muted />
            <Row label={t('profile.account.fields.joinedAt')} value={memberSinceLabel} muted />
          </div>
        </dl>
        <p className="mt-4 text-xs text-tb-muted">{t('profile.account.comingSoon')}</p>
      </article>

      {/* Idioma + Seguridad — fila de 2 tarjetas interactivas */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LanguageSection />

        <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
          <header className="mb-4 flex items-center gap-2">
            <KeyIcon />
            <h2 className="font-display text-base font-bold text-tb-text">
              {t('profile.account.security')}
            </h2>
          </header>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Field
              id="current-password"
              label={t('profile.account.currentPassword')}
              type="password"
              autoComplete="current-password"
              value={currentPwd}
              onChange={onCurrentPwd}
            />
            <Field
              id="new-password"
              label={t('profile.account.newPassword')}
              type="password"
              autoComplete="new-password"
              value={newPwd}
              onChange={onNewPwd}
            />
            <Field
              id="confirm-password"
              label={t('profile.account.confirmPassword')}
              type="password"
              autoComplete="new-password"
              value={confirmPwd}
              onChange={onConfirmPwd}
            />
            {pwdMsg && (
              <p role="status" className="text-xs font-medium text-tb-accent">
                {pwdMsg}
              </p>
            )}
            <button
              type="submit"
              className="tb-gradient-cta mt-1 rounded-lg px-4 py-2 text-sm font-semibold text-tb-accent-fg transition-opacity hover:opacity-90"
            >
              {t('profile.account.savePassword')}
            </button>
          </form>
        </article>
      </div>

      <TwoFactorCard initiallyEnabled={me.twoFactorEnabled} />
    </div>
  );
}

type TwoFactorStep = 'idle' | 'setup' | 'backupCodes';

function TwoFactorCard({ initiallyEnabled }: { initiallyEnabled: boolean }) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [step, setStep] = useState<TwoFactorStep>('idle');
  const [setupData, setSetupData] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function errorMessage(err: unknown): string {
    return err instanceof ApiError ? err.message : t('profile.account.twoFactor.genericError');
  }

  async function handleStartSetup() {
    setError('');
    setBusy(true);
    try {
      const data = await setupTwoFactor();
      setSetupData(data);
      setStep('setup');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmEnable(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { backupCodes: codes } = await enableTwoFactor(code);
      setBackupCodes(codes);
      setStep('backupCodes');
      setCode('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function handleDone() {
    setEnabled(true);
    setStep('idle');
    setSetupData(null);
    setBackupCodes([]);
  }

  async function handleDisable(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await disableTwoFactor(disablePassword);
      setEnabled(false);
      setDisablePassword('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
      <header className="mb-4 flex items-center gap-2">
        <ShieldIcon />
        <h2 className="font-display text-base font-bold text-tb-text">{t('profile.account.twoFactor.title')}</h2>
      </header>

      {error && <p className="mb-3 text-xs font-medium text-tb-danger">{error}</p>}

      {step === 'idle' && !enabled && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-sm text-tb-muted">{t('profile.account.twoFactor.disabledNotice')}</p>
          <button
            type="button"
            onClick={handleStartSetup}
            disabled={busy}
            className="tb-gradient-cta rounded-lg px-4 py-2 text-sm font-semibold text-tb-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t('profile.account.twoFactor.enable')}
          </button>
        </div>
      )}

      {step === 'setup' && setupData && (
        <form onSubmit={handleConfirmEnable} className="flex flex-col gap-4">
          <p className="text-sm text-tb-muted">{t('profile.account.twoFactor.setupInstructions')}</p>
          <img
            src={setupData.qrDataUrl}
            alt={t('profile.account.twoFactor.qrAlt')}
            className="h-40 w-40 self-start rounded-lg border border-tb-border bg-white p-2"
          />
          <p
            data-testid="two-factor-secret"
            className="tb-nums break-all rounded-lg border border-tb-border bg-tb-surface-2 px-3 py-2 text-xs text-tb-muted"
          >
            {setupData.secret}
          </p>
          <Field id="two-factor-setup-code" label={t('profile.account.twoFactor.codeLabel')} type="text" value={code} onChange={setCode} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep('idle');
                setSetupData(null);
                setCode('');
                setError('');
              }}
              className="rounded-lg border border-tb-border px-4 py-2 text-sm font-medium text-tb-muted hover:bg-tb-surface-2"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={busy || !code}
              className="tb-gradient-cta rounded-lg px-4 py-2 text-sm font-semibold text-tb-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t('profile.account.twoFactor.confirm')}
            </button>
          </div>
        </form>
      )}

      {step === 'backupCodes' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-tb-danger">{t('profile.account.twoFactor.backupCodesWarning')}</p>
          <ul className="tb-nums grid grid-cols-2 gap-2 rounded-lg border border-tb-border bg-tb-surface-2 p-4 text-sm sm:grid-cols-5">
            {backupCodes.map((c) => (
              <li key={c} data-testid="backup-code" className="text-center text-tb-text">
                {c}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleDone}
            className="tb-gradient-cta self-start rounded-lg px-4 py-2 text-sm font-semibold text-tb-accent-fg transition-opacity hover:opacity-90"
          >
            {t('profile.account.twoFactor.done')}
          </button>
        </div>
      )}

      {step === 'idle' && enabled && (
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-tb-success">
            <CheckIcon className="h-4 w-4" />
            {t('profile.account.twoFactor.enabledNotice')}
          </p>
          <form onSubmit={handleDisable} className="flex flex-col gap-3 sm:max-w-sm">
            <Field
              id="two-factor-disable-password"
              label={t('profile.account.twoFactor.disablePasswordLabel')}
              type="password"
              autoComplete="current-password"
              value={disablePassword}
              onChange={setDisablePassword}
            />
            <button
              type="submit"
              disabled={busy || !disablePassword}
              className="self-start rounded-lg border border-tb-border px-4 py-2 text-sm font-medium text-tb-muted hover:border-tb-danger hover:text-tb-danger disabled:opacity-50"
            >
              {t('profile.account.twoFactor.disable')}
            </button>
          </form>
          <TrustedDevicesList />
        </div>
      )}
    </article>
  );
}

function TrustedDevicesList() {
  const { t } = useTranslation();
  const [devices, setDevices] = useState<TrustedDevice[] | null>(null);

  useEffect(() => {
    listTrustedDevices()
      .then((data) => setDevices(data.devices))
      .catch(() => setDevices([]));
  }, []);

  async function handleRevoke(id: string) {
    await revokeTrustedDevice(id);
    setDevices((prev) => prev?.filter((d) => d.id !== id) ?? null);
  }

  async function handleRevokeAll() {
    await revokeAllTrustedDevices();
    setDevices([]);
  }

  if (!devices || devices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-tb-border pt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{t('profile.account.twoFactor.devicesTitle')}</p>
        <button type="button" onClick={handleRevokeAll} className="text-xs font-semibold text-tb-danger hover:underline">
          {t('profile.account.twoFactor.revokeAll')}
        </button>
      </div>
      <ul className="flex flex-col divide-y divide-tb-border">
        {devices.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-2 py-2">
            <span className="truncate text-xs text-tb-muted">{d.userAgent ?? t('profile.account.twoFactor.unknownDevice')}</span>
            <button
              type="button"
              onClick={() => handleRevoke(d.id)}
              className="shrink-0 text-xs font-semibold text-tb-muted hover:text-tb-danger"
            >
              {t('profile.account.twoFactor.revoke')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FriendsTab() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { friends } = useFriendsList();
  const { data: pending } = trpc.friends.listPending.useQuery();

  function invalidate() {
    void utils.friends.list.invalidate();
    void utils.friends.listPending.invalidate();
  }
  const accept = trpc.friends.accept.useMutation({ onSuccess: invalidate });
  const reject = trpc.friends.reject.useMutation({ onSuccess: invalidate });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
        <h2 className="font-display text-base font-bold text-tb-text">
          {t('profile.friends.summary', { count: friends.length })}
        </h2>
        <ul className="mt-4 flex flex-col divide-y divide-tb-border">
          {friends.map((f) => (
            <li key={f.userId} className="flex items-center gap-3 py-3">
              <Avatar
                initial={f.avatarInitial ?? f.username.charAt(0).toUpperCase()}
                color={f.avatarColor ?? '#2f6fe0'}
                presence={f.presence === 'in_game' ? 'online' : f.presence}
                size={36}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-tb-text">{f.displayName}</p>
                <p className="text-xs text-tb-muted">@{f.username}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link
          to="/amigos"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-tb-accent hover:text-tb-accent-strong"
        >
          {t('profile.friends.manage')} →
        </Link>
      </article>

      <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
        <h2 className="font-display text-base font-bold text-tb-text">
          {t('profile.friends.requests')}
        </h2>
        <ul className="mt-4 flex flex-col divide-y divide-tb-border">
          {(pending?.incoming.length ?? 0) === 0 && (
            <p className="py-3 text-sm text-tb-muted">{t('friends.noIncoming')}</p>
          )}
          {pending?.incoming.map((r) => (
            <li key={r.profile.userId} className="flex items-center gap-3 py-3">
              <Avatar initial={r.profile.avatarInitial ?? r.profile.username.charAt(0).toUpperCase()} color={r.profile.avatarColor ?? '#2f6fe0'} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-tb-text">{r.profile.displayName}</p>
                <p className="text-xs text-tb-muted">{t('profile.friends.wantsToBe')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => reject.mutate({ userId: r.profile.userId })}
                  className="rounded-lg border border-tb-border bg-tb-surface px-3 py-1.5 text-xs font-semibold text-tb-muted hover:border-tb-danger hover:text-tb-danger"
                >
                  {t('profile.friends.reject')}
                </button>
                <button
                  type="button"
                  onClick={() => accept.mutate({ userId: r.profile.userId })}
                  className="tb-gradient-cta rounded-lg px-3 py-1.5 text-xs font-semibold text-tb-accent-fg hover:opacity-90"
                >
                  {t('profile.friends.accept')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

function MatchesTab() {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const { data: summary } = trpc.ratings.mySummary.useQuery();
  const { data: recent } = trpc.matches.recent.useQuery();

  const totals = (summary ?? []).reduce(
    (acc, g) => ({
      played: acc.played + g.played,
      wins: acc.wins + g.wins,
      losses: acc.losses + g.losses,
      draws: acc.draws + g.draws,
    }),
    { played: 0, wins: 0, losses: 0, draws: 0 },
  );
  const ratedGames = (summary ?? []).filter((g) => g.rating != null);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
        <h2 className="font-display text-base font-bold text-tb-text">{t('profile.matches.stats')}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label={t('profile.matches.statsPlayed')} value={totals.played} />
          <StatTile label={t('profile.matches.statsWins')} value={totals.wins} tone="success" />
          <StatTile label={t('profile.matches.statsLosses')} value={totals.losses} tone="danger" />
          <StatTile label={t('profile.matches.statsDraws')} value={totals.draws} />
        </dl>
      </article>

      {/* Rating por juego */}
      {ratedGames.length > 0 && (
        <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
          <h2 className="font-display text-base font-bold text-tb-text">{t('profile.matches.ratings')}</h2>
          <ul className="mt-4 flex flex-col divide-y divide-tb-border">
            {ratedGames.map((g) => (
              <li key={g.gameId} className="flex items-center justify-between py-3">
                <span className="text-sm font-semibold text-tb-text">{g.gameName}</span>
                <span className="tb-nums font-display text-lg font-extrabold text-tb-accent">
                  {Math.round(g.rating!)}
                  <span className="ml-1 text-xs font-normal text-tb-muted">± {Math.round(g.rd!)}</span>
                </span>
              </li>
            ))}
          </ul>
        </article>
      )}

      {/* Recientes */}
      <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
        <h2 className="font-display text-base font-bold text-tb-text">{t('profile.matches.recent')}</h2>
        {!recent || recent.length === 0 ? (
          <p className="mt-4 text-sm text-tb-muted">{t('profile.matches.empty')}</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-tb-border">
            {recent.map((m) => {
              const result: MatchResult = m.result === 'lose' ? 'loss' : m.result;
              const style = resultStyles[result];
              const resultLabel = t(
                `profile.matches.result${result.charAt(0).toUpperCase()}${result.slice(1)}`,
              );
              const opponent = m.opponents[0];
              const opponentNames = m.opponents.map((o) => o.username).join(', ');
              return (
                <li key={m.matchId} className="flex items-center gap-3 py-3">
                  <Avatar
                    initial={opponent?.avatarInitial ?? opponent?.username.charAt(0).toUpperCase() ?? '?'}
                    color={opponent?.avatarColor ?? '#2f6fe0'}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-tb-text">
                      {m.gameName} · {t('profile.matches.vs', { name: opponentNames || '—' })}
                    </p>
                    <p className="text-xs text-tb-muted">
                      {m.finishedAt
                        ? new Date(m.finishedAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })
                        : ''}
                    </p>
                  </div>
                  {m.ratingDelta != null && (
                    <span
                      className={`tb-nums text-xs font-semibold ${m.ratingDelta >= 0 ? 'text-tb-success' : 'text-tb-danger'}`}
                    >
                      {m.ratingDelta >= 0 ? '+' : ''}
                      {m.ratingDelta}
                    </span>
                  )}
                  <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
                  <span className={`hidden text-xs font-semibold sm:inline ${style.text}`}>
                    {resultLabel}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    </div>
  );
}

function AchievementsTab() {
  const { t } = useTranslation();
  return (
    <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
      <h2 className="font-display text-base font-bold text-tb-text">
        {t('profile.tabs.achievements')}
      </h2>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {demoAchievements.map((a) => (
          <li
            key={a.id}
            className={`tb-card flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-opacity ${
              a.unlocked
                ? 'border-tb-border bg-tb-surface-2'
                : 'border-tb-border bg-tb-surface-2 opacity-50'
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                a.unlocked ? 'bg-tb-accent-tint text-tb-accent' : 'bg-tb-surface text-tb-muted'
              }`}
              aria-hidden="true"
            >
              {a.unlocked ? <StarIcon /> : <MedalIcon />}
            </span>
            <p className="text-sm font-semibold text-tb-text">{t(`demo.achievements.${a.nameKey}.name`)}</p>
            <p className="text-xs text-tb-muted">{t(`demo.achievements.${a.descKey}.desc`)}</p>
            <span
              className={`mt-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                a.unlocked ? 'bg-tb-success/15 text-tb-success' : 'bg-tb-surface text-tb-muted'
              }`}
            >
              {t(a.unlocked ? 'profile.achievements.unlocked' : 'profile.achievements.locked')}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

// --- Átomos reutilizados ---

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{label}</dt>
      <dd className={muted ? 'text-sm text-tb-muted' : 'text-sm font-semibold text-tb-text'}>
        {value}
      </dd>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  type: 'password' | 'text';
  autoComplete?: string;
  value: string;
  onChange: (v: string) => void;
}

function Field({ id, label, type, autoComplete, value, onChange }: FieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{label}</span>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-tb-border bg-tb-surface px-3 py-2 text-sm text-tb-text outline-none transition-colors focus:border-tb-accent focus:ring-2 focus:ring-tb-accent/30"
      />
    </label>
  );
}

function StatTile({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  const valueColor =
    tone === 'success' ? 'text-tb-success' : tone === 'danger' ? 'text-tb-danger' : 'text-tb-text';
  return (
    <div className="tb-card rounded-xl border border-tb-border bg-tb-surface-2 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-tb-muted">{label}</p>
      <p className={`tb-nums mt-1 font-display text-2xl font-extrabold ${valueColor}`}>{value}</p>
    </div>
  );
}
