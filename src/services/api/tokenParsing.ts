import type { AuthTokens } from '@/types/api';
import { ApiError } from './errors';

type RawTokens = Record<string, unknown>;

function pick(raw: RawTokens, keys: string[]): string | undefined {
    for (const k of keys) {
        const v = raw[k];
        if (typeof v === 'string' && v.length > 0) return v;
    }
    return undefined;
}

/** Normalises common token field names. Adjust the key lists to match your Swagger response. */
export function toAuthTokens(raw: unknown): AuthTokens {
    const obj = (raw && typeof raw === 'object' ? raw : {}) as RawTokens;
    const accessToken = pick(obj, ['accessToken', 'access_token', 'token', 'jwt']);
    const refreshToken = pick(obj, ['refreshToken', 'refresh_token']);
    if (!accessToken) throw new ApiError('The response contained no access token.', 'unknown');
    return { accessToken, refreshToken: refreshToken ?? '' };
}
