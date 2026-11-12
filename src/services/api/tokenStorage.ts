import * as SecureStore from 'expo-secure-store';
import type { AuthTokens } from '@/types/api';

const ACCESS = 'auth.accessToken';
const REFRESH = 'auth.refreshToken';

let cached: AuthTokens | null = null;
let loaded = false;

export const tokenStorage = {
  async load(): Promise<AuthTokens | null> {
    if (loaded) return cached;
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS),
      SecureStore.getItemAsync(REFRESH),
    ]);
    cached = accessToken && refreshToken ? { accessToken, refreshToken } : null;
    loaded = true;
    return cached;
  },
  async save(tokens: AuthTokens): Promise<void> {
    cached = tokens;
    loaded = true;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH, tokens.refreshToken),
    ]);
  },
  async clear(): Promise<void> {
    cached = null;
    loaded = true;
    await Promise.all([SecureStore.deleteItemAsync(ACCESS), SecureStore.deleteItemAsync(REFRESH)]);
  },
};
