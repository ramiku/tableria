import { apiFetch } from './api';

export interface Me {
  id: string;
  username: string;
  displayName: string;
  avatarInitial: string | null;
  avatarColor: string | null;
}

export async function fetchMe(): Promise<Me | null> {
  try {
    const data = await apiFetch<{ ok: true; user: Me }>('/api/auth/me');
    return data.user;
  } catch {
    return null;
  }
}

export function login(identifier: string, password: string) {
  return apiFetch<{ ok: true; user: Me }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });
}

export function register(username: string, email: string, password: string) {
  return apiFetch<{ ok: true; user: Me }>('/api/auth/register', {
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
