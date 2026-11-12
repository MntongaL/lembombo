import axios from 'axios';

export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'config' | 'unknown';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  constructor(message: string, kind: ApiErrorKind, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
  }
  /** True when the request definitely never produced a server response. */
  get isOffline(): boolean { return this.kind === 'network'; }
}

function extractMessage(data: unknown): string | null {
  if (typeof data === 'string' && data.trim()) return data.slice(0, 300);
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    for (const k of ['message', 'detail', 'error', 'title']) {
      const v = o[k];
      if (typeof v === 'string' && v.trim()) return v;
    }
  }
  return null;
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const status = err.response.status;
      const msg = extractMessage(err.response.data) ?? `Request failed (HTTP ${status})`;
      return new ApiError(msg, 'http', status);
    }
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return new ApiError(`The server took too long to respond (${err.config?.baseURL ?? ''}${err.config?.url ?? ''}).`, 'timeout');
    }
    return new ApiError(`Cannot reach the server at ${err.config?.baseURL || '(API URL not set)'} (${err.code ?? err.message}). Check the API URL, Wi-Fi and firewall.`, 'network');
  }
  return new ApiError(err instanceof Error ? err.message : 'Unexpected error', 'unknown');
}
