/**
 * Dev-only API request log. Nothing is recorded in release builds (__DEV__ is false).
 * Secrets are redacted: passwords, tokens, Authorization values never reach the log or console.
 */
export interface ApiLogEntry {
  id: number;
  at: string;
  method: string;
  url: string; // baseURL + path
  hasAuth: boolean;
  retry: boolean;
  status?: number;
  ms?: number;
  error?: string; // axios error code / message when there was no HTTP response
  requestBody?: string;
  responseBody?: string;
}

export const API_DEBUG = typeof __DEV__ !== 'undefined' && __DEV__;
const MAX_ENTRIES = 100;
const MAX_BODY_CHARS = 1500;
const SECRET_KEY = /pass(word)?|token|authorization|secret|jwt/i;

let entries: ApiLogEntry[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[deep]';
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEY.test(k) ? '[redacted]' : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

export function stringifyBody(raw: unknown): string | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  let data: unknown = raw;
  if (typeof raw === 'string') {
    try { data = JSON.parse(raw); } catch { return raw.slice(0, MAX_BODY_CHARS); }
  }
  const text = JSON.stringify(redact(data));
  return text.length > MAX_BODY_CHARS ? `${text.slice(0, MAX_BODY_CHARS)}… (truncated)` : text;
}

export const apiLog = {
  start(init: { method: string; url: string; hasAuth: boolean; retry: boolean; body: unknown }): number {
    const id = nextId++;
    if (!API_DEBUG) return id;
    const entry: ApiLogEntry = {
      id, at: new Date().toISOString(), method: init.method.toUpperCase(), url: init.url,
      hasAuth: init.hasAuth, retry: init.retry, requestBody: stringifyBody(init.body),
    };
    entries = [entry, ...entries].slice(0, MAX_ENTRIES);
    console.log(`[api] → ${entry.method} ${entry.url} auth=${entry.hasAuth ? 'bearer' + entry.requestBody : 'none'}${entry.retry ? ' (retry after refresh)' : ''}`);
    emit();
    return id;
  },
  finish(id: number, startedAt: number, result: { status?: number; body?: unknown; error?: string }): void {
    if (!API_DEBUG) return;
    const ms = Date.now() - startedAt;
    entries = entries.map((e) => (e.id === id ? { ...e, ms, status: result.status, error: result.error, responseBody: stringifyBody(result.body) } : e));
    const e = entries.find((x) => x.id === id);
    if (e) console.log(`[api] ← ${result.status ?? 'NO RESPONSE'} ${e.method} ${e.url} ${ms}ms${result.error ? ` error=${result.error}` : ''}${result.status && result.status >= 400 ? ` body=${e.responseBody ?? ''}` : ''}`);
    emit();
  },
  list: (): ApiLogEntry[] => entries,
  clear(): void { entries = []; emit(); },
  subscribe(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; },
};
