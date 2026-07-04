import { useState, type FormEvent } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../components/Avatar';
import {
  CalendarIcon,
  KeyIcon,
  MedalIcon,
  PencilIcon,
  ShieldIcon,
  StarIcon,
} from '../components/icons';
import { LanguageSection } from '../components/LanguageSelector';
import type { Presence } from '../components/Avatar';
import { useLocaleStore } from '../stores/i18n';

export const Route = createFileRoute('/_app/perfil')({ component: ProfilePage });

type TabKey = 'account' | 'friends' | 'matches' | 'achievements';
const tabs: TabKey[] = ['account', 'friends', 'matches', 'achievements'];

// --- Datos demo (hasta que M1/M3 sirvan datos reales desde la API) ---
const demoFriends = [
  { id: '1', name: 'Lucía Tester', initial: 'L', color: '#2f6fe0', presence: 'online' as Presence },
  { id: '2', name: 'ramiku1', initial: 'R', color: '#1c5c52', presence: 'online' as Presence },
];

const demoRequests = [
  { id: 'r1', name: 'pepe_bot', initial: 'P', color: '#6e3b2f' },
  { id: 'r2', name: 'maria_caz', initial: 'M', color: '#4a2f6e' },
];

type MatchResult = 'win' | 'loss' | 'draw';
const demoStats = { played: 24, wins: 14, losses: 7, draws: 3 };
const demoMatches: {
  id: string;
  gameKey: 'ticTacToe';
  opponent: string;
  opponentColor: string;
  opponentInitial: string;
  result: MatchResult;
  score: string;
  whenKey: 'twoHoursAgo' | 'yesterday' | 'threeDaysAgo' | 'fiveDaysAgo';
}[] = [
  { id: '1', gameKey: 'ticTacToe', opponent: 'Lucía Tester', opponentColor: '#2f6fe0', opponentInitial: 'L', result: 'win', score: '3-1', whenKey: 'twoHoursAgo' },
  { id: '2', gameKey: 'ticTacToe', opponent: 'ramiku1', opponentColor: '#1c5c52', opponentInitial: 'R', result: 'loss', score: '0-3', whenKey: 'yesterday' },
  { id: '3', gameKey: 'ticTacToe', opponent: 'Lucía Tester', opponentColor: '#2f6fe0', opponentInitial: 'L', result: 'draw', score: '1-1', whenKey: 'threeDaysAgo' },
  { id: '4', gameKey: 'ticTacToe', opponent: 'ramiku1', opponentColor: '#1c5c52', opponentInitial: 'R', result: 'win', score: '3-0', whenKey: 'fiveDaysAgo' },
];

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
  me: { username: string; displayName: string };
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
            <Row label={t('profile.account.fields.email')} value="—" muted />
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
    </div>
  );
}

function FriendsTab() {
  const { t } = useTranslation();
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
        <h2 className="font-display text-base font-bold text-tb-text">
          {t('profile.friends.summary', { count: demoFriends.length })}
        </h2>
        <ul className="mt-4 flex flex-col divide-y divide-tb-border">
          {demoFriends.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-3">
              <Avatar initial={f.initial} color={f.color} presence={f.presence} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-tb-text">{f.name}</p>
                <p className="text-xs text-tb-muted">@{f.name.toLowerCase().replace(/\s+/g, '_')}</p>
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
          {demoRequests.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-3">
              <Avatar initial={r.initial} color={r.color} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-tb-text">{r.name}</p>
                <p className="text-xs text-tb-muted">{t('profile.friends.wantsToBe')}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-tb-border bg-tb-surface px-3 py-1.5 text-xs font-semibold text-tb-muted hover:border-tb-danger hover:text-tb-danger"
                >
                  {t('profile.friends.reject')}
                </button>
                <button
                  type="button"
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
  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
        <h2 className="font-display text-base font-bold text-tb-text">{t('profile.matches.stats')}</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label={t('profile.matches.statsPlayed')} value={demoStats.played} />
          <StatTile label={t('profile.matches.statsWins')} value={demoStats.wins} tone="success" />
          <StatTile label={t('profile.matches.statsLosses')} value={demoStats.losses} tone="danger" />
          <StatTile label={t('profile.matches.statsDraws')} value={demoStats.draws} />
        </dl>
      </article>

      {/* Recientes */}
      <article className="tb-card rounded-2xl border border-tb-border bg-tb-surface p-6">
        <h2 className="font-display text-base font-bold text-tb-text">{t('profile.matches.recent')}</h2>
        {demoMatches.length === 0 ? (
          <p className="mt-4 text-sm text-tb-muted">{t('profile.matches.empty')}</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-tb-border">
            {demoMatches.map((m) => {
              const style = resultStyles[m.result];
              const resultLabel = t(
                `profile.matches.result${m.result.charAt(0).toUpperCase()}${m.result.slice(1)}`,
              );
              return (
                <li key={m.id} className="flex items-center gap-3 py-3">
                  <Avatar initial={m.opponentInitial} color={m.opponentColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-tb-text">
                      {t(`demo.games.${m.gameKey}`)} · {t('profile.matches.vs', { name: m.opponent })}
                    </p>
                    <p className="text-xs text-tb-muted">{t(`demo.matches.timeAgo.${m.whenKey}`)}</p>
                  </div>
                  <span
                    className={`tb-nums rounded-md px-2 py-0.5 text-xs font-semibold ${style.text} ${style.bg}`}
                  >
                    {m.score}
                  </span>
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
  type: 'password';
  autoComplete: string;
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
