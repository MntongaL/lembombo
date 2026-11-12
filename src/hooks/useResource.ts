import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useSync } from '@/providers/SyncProvider';
import type { DataSource, Loaded } from '@/types/app';
import { toApiError } from '@/services/api/errors';

interface State<T> {
  data: T | null;
  source: DataSource | null;
  fetchedAt: string | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

/** Loads on focus, supports pull-to-refresh, and reloads after a sync changed data. */
export function useResource<T>(loader: () => Promise<Loaded<T>>, key: string) {
  const { dataVersion } = useSync();
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const seq = useRef(0);
  const [state, setState] = useState<State<T>>({ data: null, source: null, fetchedAt: null, loading: true, refreshing: false, error: null });

  const load = useCallback(async (refreshing: boolean) => {
    const mine = ++seq.current;
    setState((s) => ({ ...s, loading: !refreshing && s.data === null, refreshing, error: null }));
    try {
      const res = await loaderRef.current();
      if (mine !== seq.current) return;
      setState({ data: res.data, source: res.source, fetchedAt: res.fetchedAt, loading: false, refreshing: false, error: null });
    } catch (err) {
      if (mine !== seq.current) return;
      setState((s) => ({ ...s, loading: false, refreshing: false, error: toApiError(err).message }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load, key, dataVersion]),
  );

  return { ...state, reload: () => load(false), refresh: () => load(true) };
}
