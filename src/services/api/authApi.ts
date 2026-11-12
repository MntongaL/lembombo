import type { AuthTokens, LoginRequest, RegisterRequest } from '@/types/api';
import { http } from './client';
import { toAuthTokens } from './tokenParsing';

export const authApi = {
  async login(body: LoginRequest): Promise<AuthTokens> {
    return toAuthTokens((await http.post<unknown>('/api/auth/login', body)).data);
  },
  /** Returns tokens if the register response contains them, otherwise null (the app then logs in). */
  async register(body: RegisterRequest): Promise<AuthTokens | null> {
    const res = await http.post<unknown>('/api/auth/register', body);
    if (!res.data || typeof res.data !== 'object') return null;
    try { return toAuthTokens(res.data); } catch { return null; }
  },
};
