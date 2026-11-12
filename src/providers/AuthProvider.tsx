import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/services/api/authApi';
import { refreshSession, setAuthLostHandler } from '@/services/api/client';
import { toApiError } from '@/services/api/errors';
import { tokenStorage } from '@/services/api/tokenStorage';
import { clearAllLocalData } from '@/services/database/db';
import type { LoginRequest, RegisterRequest } from '@/types/api';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';
interface AuthCtx {
  status: AuthStatus;
  signIn: (body: LoginRequest) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Explicit sign-out: wipes tokens AND local data.
  const signOut = useCallback(async () => {
    await tokenStorage.clear();
    await clearAllLocalData().catch(() => undefined);
    setStatus('signedOut');
  }, []);

  // Server rejected the session: go to login, but keep local data so offline-queued records aren't lost.
  const expireSession = useCallback(async () => {
    await tokenStorage.clear();
    setStatus('signedOut');
  }, []);

  // App start: refresh the token; if the server rejects it, show login.
  // If the server is just unreachable, stay signed in and work from the cache.
  useEffect(() => {
    setAuthLostHandler(() => { void expireSession(); });
    let cancelled = false;
    void (async () => {
      const tokens = await tokenStorage.load();
      if (!tokens) { if (!cancelled) setStatus('signedOut'); return; }
      try {
        await refreshSession(8000);
        if (!cancelled) setStatus('signedIn');
      } catch (e) {
        const err = toApiError(e);
        const unreachable =
          err.kind === 'network' || err.kind === 'timeout' || err.kind === 'config' ||
          (err.kind === 'http' && (err.status ?? 0) >= 500);
        if (cancelled) return;
        if (unreachable) setStatus('signedIn');
        else await expireSession();
      }
    })();
    return () => { cancelled = true; setAuthLostHandler(null); };
  }, [expireSession]);

  const signIn = useCallback(async (body: LoginRequest) => {
    const tokens = await authApi.login(body);
    await tokenStorage.save(tokens);
    setStatus('signedIn');
  }, []);

  const register = useCallback(async (body: RegisterRequest) => {
    const res = await authApi.register(body);
    if (res?.accessToken && res.refreshToken) {
      await tokenStorage.save({ accessToken: res.accessToken, refreshToken: res.refreshToken });
      setStatus('signedIn');
    } else {
      await signIn({ email: body.email, password: body.password });
    }
  }, [signIn]);

  const value = useMemo(() => ({ status, signIn, register, signOut }), [status, signIn, register, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}