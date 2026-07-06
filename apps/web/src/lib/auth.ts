import { apiFetch } from './api';

/** Forma devuelta por login/register/2fa-verify (`publicUser()` en el servidor). */
export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  avatarInitial: string | null;
  avatarColor: string | null;
}

/** Forma devuelta por `/api/auth/me` (sesión propia, con más detalle). */
export interface Me extends PublicUser {
  email: string;
  twoFactorEnabled: boolean;
  isAdmin: boolean;
}

export async function fetchMe(): Promise<Me | null> {
  try {
    const data = await apiFetch<{ ok: true; user: Me }>('/api/auth/me');
    return data.user;
  } catch {
    return null;
  }
}

export interface MaintenanceStatus {
  enabled: boolean;
  maintenanceMessage: string | null;
}

/** Sin autenticación — se consulta desde `_app` en cada carga para decidir si mostrar la pantalla de mantenimiento. */
export async function fetchMaintenanceStatus(): Promise<MaintenanceStatus> {
  try {
    const data = await apiFetch<{ ok: true; enabled: boolean; message: string | null }>('/api/maintenance-status');
    return { enabled: data.enabled, maintenanceMessage: data.message };
  } catch {
    return { enabled: false, maintenanceMessage: null };
  }
}

export type LoginResponse = { ok: true; user: PublicUser } | { ok: true; requiresTwoFactor: true; challengeToken: string };

export function login(identifier: string, password: string) {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

export function verifyTwoFactor(challengeToken: string, code: string, trustDevice = false) {
  return apiFetch<{ ok: true; user: PublicUser }>('/api/auth/2fa/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeToken, code, trustDevice }),
  });
}

export interface TwoFactorSetup {
  secret: string;
  otpauthUri: string;
  qrDataUrl: string;
}

export function setupTwoFactor() {
  return apiFetch<{ ok: true } & TwoFactorSetup>('/api/auth/2fa/setup', { method: 'POST' });
}

export function enableTwoFactor(code: string) {
  return apiFetch<{ ok: true; backupCodes: string[] }>('/api/auth/2fa/enable', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function disableTwoFactor(password: string) {
  return apiFetch<{ ok: true }>('/api/auth/2fa/disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function register(username: string, email: string, password: string) {
  return apiFetch<{ ok: true; user: PublicUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export function logout() {
  return apiFetch<{ ok: true }>('/api/auth/logout', { method: 'POST' });
}

export function forgotPassword(email: string) {
  return apiFetch<{ ok: true; message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, password: string) {
  return apiFetch<{ ok: true }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export function requestMagicLink(identifier: string) {
  return apiFetch<{ ok: true; message: string }>('/api/auth/magic-link/request', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  });
}

export function consumeMagicLink(token: string) {
  return apiFetch<{ ok: true; user: PublicUser }>('/api/auth/magic-link/consume', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export interface TrustedDevice {
  id: string;
  userAgent: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
}

export function listTrustedDevices() {
  return apiFetch<{ ok: true; devices: TrustedDevice[] }>('/api/auth/trusted-devices');
}

export function revokeTrustedDevice(id: string) {
  return apiFetch<{ ok: true }>(`/api/auth/trusted-devices/${id}`, { method: 'DELETE' });
}

export function revokeAllTrustedDevices() {
  return apiFetch<{ ok: true }>('/api/auth/trusted-devices', { method: 'DELETE' });
}
