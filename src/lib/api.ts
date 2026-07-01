import { API_URL } from './utils';

let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (at: string, rt: string) => {
  accessToken = at;
  refreshToken = rt;
  if (typeof window !== 'undefined') {
    localStorage.setItem('felovy_at', at);
    localStorage.setItem('felovy_rt', rt);
  }
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('felovy_at');
    localStorage.removeItem('felovy_rt');
  }
};

export const loadTokens = () => {
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('felovy_at');
    refreshToken = localStorage.getItem('felovy_rt');
  }
};

const refreshAccessToken = async (): Promise<boolean> => {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.accessToken;
    if (typeof window !== 'undefined') localStorage.setItem('felovy_at', data.accessToken);
    return true;
  } catch {
    return false;
  }
};

export const apiFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  loadTokens();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    }
  }

  return res;
};

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: unknown) =>
    apiFetch(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (path: string, body: unknown) =>
    apiFetch(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  patch: (path: string, body: unknown) =>
    apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
};
