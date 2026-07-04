function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]!) : null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** fetch con cookies de sesión + cabecera CSRF (double-submit) en mutaciones. */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);

  if (method !== 'GET' && method !== 'HEAD') {
    const csrf = getCookie('tb_csrf');
    if (csrf) headers.set('x-csrf-token', csrf);
    if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  }

  const res = await fetch(path, { ...options, method, headers, credentials: 'include' });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, (data as { error?: string } | null)?.error ?? 'Algo ha ido mal');
  }
  return data as T;
}
