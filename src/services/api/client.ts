import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { API_URL, IS_API_CONFIGURED, REQUEST_TIMEOUT_MS } from '@/config/env';
import type { AuthTokens } from '@/types/api';
import { apiLog } from './debug';
import { ApiError, toApiError } from './errors';
import { toAuthTokens } from './tokenParsing';
import { tokenStorage } from './tokenStorage';

const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh'];
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const inflight = new WeakMap<InternalAxiosRequestConfig, { id: number; startedAt: number }>();
const fullUrl = (c: InternalAxiosRequestConfig) => `${c.baseURL ?? ''}${c.url ?? ''}`;
if (__DEV__) console.log(`[api] base URL = ${API_URL || '(NOT SET)'}`);

let onAuthLost: (() => void) | null = null;
export function setAuthLostHandler(fn: (() => void) | null): void { onAuthLost = fn; }

/** Bare instance without interceptors, used for the refresh call itself. */
const bare: AxiosInstance = axios.create({ baseURL: API_URL, timeout: REQUEST_TIMEOUT_MS });

export const http: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

http.interceptors.request.use(async (config) => {
  if (!IS_API_CONFIGURED) throw new ApiError('EXPO_PUBLIC_API_URL is not set. See README.', 'config');
  const url = config.url ?? '';
  if (!AUTH_PATHS.some((p) => url.startsWith(p))) {
    const tokens = await tokenStorage.load();
    if (tokens) config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }
  const hasAuth = Boolean(config.headers.get('Authorization'));
  const id = apiLog.start({ method: config.method ?? 'get', url: fullUrl(config), hasAuth, retry: Boolean((config as RetriableConfig)._retried), body: config.data });
  inflight.set(config, { id, startedAt: Date.now() });
  return config;
});

let refreshing: Promise<AuthTokens> | null = null;

async function refreshTokens(timeoutMs?: number): Promise<AuthTokens> {
  const current = await tokenStorage.load();
  if (!current || !current.refreshToken) throw new ApiError('Not signed in', 'http', 401);
  const url = `${API_URL}/api/auth/refresh`;
  const logId = apiLog.start({ method: 'post', url, hasAuth: false, retry: false, body: { refreshToken: current.refreshToken } });
  const startedAt = Date.now();
  try {
    const res = await bare.post<unknown>('/api/auth/refresh', { refreshToken: current.refreshToken }, timeoutMs ? { timeout: timeoutMs } : undefined);
    apiLog.finish(logId, startedAt, { status: res.status, body: res.data });
    const parsed = toAuthTokens(res.data);
    const next: AuthTokens = { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken || current.refreshToken };
    await tokenStorage.save(next);
    return next;
  } catch (err) {
    if (axios.isAxiosError(err)) apiLog.finish(logId, startedAt, { status: err.response?.status, body: err.response?.data, error: err.response ? undefined : (err.code ?? err.message) });
    throw err;
  }
}

/** Single-flight: concurrent callers (startup + a 401 retry) share one refresh request. */
export function refreshSession(timeoutMs?: number): Promise<AuthTokens> {
  refreshing = refreshing ?? refreshTokens(timeoutMs).finally(() => { refreshing = null; });
  return refreshing.catch((e: unknown) => { throw toApiError(e); });
}

http.interceptors.response.use(
  (r) => {
    const t = inflight.get(r.config);
    if (t) apiLog.finish(t.id, t.startedAt, { status: r.status, body: r.data });
    return r;
  },
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.config) {
      const t = inflight.get(error.config);
      if (t) apiLog.finish(t.id, t.startedAt, { status: error.response?.status, body: error.response?.data, error: error.response ? undefined : (error.code ?? error.message) });
    }
    if (axios.isAxiosError(error) && error.response?.status === 401 && error.config) {
      const cfg = error.config as RetriableConfig;
      const isAuthCall = AUTH_PATHS.some((p) => (cfg.url ?? '').startsWith(p));
      if (!isAuthCall && !cfg._retried) {
        cfg._retried = true;
        try {
          const tokens = await refreshSession();
          cfg.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
          return http.request(cfg);
        } catch (refreshErr) {
          const e = toApiError(refreshErr);
          // Only sign out when the server rejected the refresh token, not when offline.
          if (e.kind === 'http') {
            await tokenStorage.clear();
            onAuthLost?.();
          }
          throw e;
        }
      }
    }
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      await tokenStorage.clear();
      onAuthLost?.();
    }
    throw toApiError(error);
  },
);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Safe retry: only idempotent GETs, only on network failures/timeouts/5xx. */
export async function getJson<T>(url: string, config?: AxiosRequestConfig, retries = 2): Promise<T> {
  let attempt = 0;
  for (; ;) {
    try {
      const res = await http.get<T>(url, config);
      return res.data;
    } catch (err) {
      const e = toApiError(err);
      const retriable = e.kind === 'network' || e.kind === 'timeout' || (e.kind === 'http' && (e.status ?? 0) >= 500);
      if (!retriable || attempt >= retries) throw e;
      attempt += 1;
      await sleep(400 * 2 ** (attempt - 1));
    }
  }
}
