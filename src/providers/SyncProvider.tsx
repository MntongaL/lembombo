import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { pendingStore } from '@/services/database/pendingStore';
import { runSync, syncActions } from '@/services/sync/syncService';
import { useAuth } from './AuthProvider';

interface SyncCtx {
  online: boolean;
  syncing: boolean;
  pendingCount: number;
  dataVersion: number; // bumps whenever a sync changed server data; screens refetch
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
  refreshPending: () => Promise<void>;
}
const SyncContext = createContext<SyncCtx | null>(null);

export function useSync(): SyncCtx {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used inside SyncProvider');
  return ctx;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [dataVersion, setDataVersion] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const onlineRef = useRef(true);

  const refreshPending = useCallback(async () => {
    setPendingCount(await pendingStore.countOpen());
  }, []);

  const syncNow = useCallback(async () => {
    if (status !== 'signedIn' || !onlineRef.current) return;
    setSyncing(true);
    try {
      const summary = await runSync();
      if (summary.sent > 0) {
        setDataVersion((v) => v + 1);
        setLastSyncedAt(new Date().toISOString());
      }
    } finally {
      setSyncing(false);
      await refreshPending();
    }
  }, [status, refreshPending]);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => {
      const isOn = s.isConnected !== false && s.isInternetReachable !== false;
      const wasOff = !onlineRef.current;
      onlineRef.current = isOn;
      setOnline(isOn);
      if (isOn && wasOff) void syncNow();
    });
    return unsub;
  }, [syncNow]);

  useEffect(() => {
    if (status !== 'signedIn') { setPendingCount(0); return; }
    void (async () => {
      await syncActions.recoverInterrupted();
      await refreshPending();
      await syncNow();
    })();
  }, [status, refreshPending, syncNow]);

  const value = useMemo(
    () => ({ online, syncing, pendingCount, dataVersion, lastSyncedAt, syncNow, refreshPending }),
    [online, syncing, pendingCount, dataVersion, lastSyncedAt, syncNow, refreshPending],
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
