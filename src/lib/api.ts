import axios, { AxiosError, AxiosRequestConfig } from 'axios';

function normalizeApiUrl(raw?: string): string {
  if (!raw) return 'http://localhost:4000/api';
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return 'http://localhost:4000/api';
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

const RAW_API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
export const API_URL = normalizeApiUrl(RAW_API_URL);

/** Base origin of the backend without the /api prefix, for media and static assets. */
export const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const ACCESS_KEY = 'sm_access_token';
const REFRESH_KEY = 'sm_refresh_token';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.access;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Fires when the session cannot be recovered, so the app can redirect to login. */
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler = () => undefined;
export const setSessionExpiredHandler = (handler: SessionExpiredHandler) => {
  onSessionExpired = handler;
};

/**
 * A single in-flight refresh, shared by every request that got a 401 while it
 * was running. Without this, loading the dashboard on an expired token fires
 * eight refreshes at once — and because refresh tokens rotate, seven of them
 * would be replays that revoke the whole session.
 */
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) throw new Error('No refresh token');

  const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${API_URL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );

  tokenStore.set(data.accessToken, data.refreshToken);
  return data.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;

    const isRefreshCall = original?.url?.includes('/auth/refresh');
    const isLoginCall = original?.url?.includes('/auth/login');

    if (status === 401 && original && !original._retried && !isRefreshCall && !isLoginCall) {
      original._retried = true;
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const token = await refreshPromise;
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api(original);
      } catch {
        tokenStore.clear();
        onSessionExpired();
      }
    }

    return Promise.reject(error);
  },
);

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  errors?: string[] | Record<string, string[]>;
  path?: string;
}

/** Turns any thrown value into a sentence worth showing a person. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (error.code === 'ECONNABORTED') return 'The server took too long to respond.';
    if (!error.response) return 'Cannot reach the server. Check your connection.';

    const body = error.response.data;
    if (Array.isArray(body?.errors) && body.errors.length > 0) return body.errors[0];
    if (body?.message) return body.message;
    return `Request failed (${error.response.status}).`;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/** Field-level messages, keyed by field name, for react-hook-form. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<ApiErrorBody>(error)) return {};
  const errors = error.response?.data?.errors;
  if (!Array.isArray(errors)) return {};

  const result: Record<string, string> = {};
  for (const message of errors) {
    // class-validator messages read "email must be an email"; the first word is
    // the property unless a custom message replaced it.
    const field = message.split(' ')[0];
    if (field && !result[field]) result[field] = message;
  }
  return result;
}
