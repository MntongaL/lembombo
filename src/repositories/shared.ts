import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import { ApiError, toApiError } from '@/services/api/errors';
import { cacheStore } from '@/services/database/cacheStore';
import { pendingStore } from '@/services/database/pendingStore';
import type { CreateResult, EntityName, Loaded, PendingOperation, WithPending } from '@/types/app';
import { LOCAL_ID_PREFIX } from '@/types/app';
import type { Id } from '@/types/api';

/** Errors for which showing cached data is the right fallback. */
export function isUnavailable(e: ApiError): boolean {
  return e.kind === 'network' || e.kind === 'timeout' || (e.kind === 'http' && (e.status ?? 0) >= 500);
}

export async function loadList<T extends { id: Id }>(entity: EntityName, fetcher: () => Promise<T[]>): Promise<Loaded<T[]>> {
  try {
    const items = await fetcher();
    const fetchedAt = await cacheStore.replaceAll(entity, items);
    return { data: items, source: 'live', fetchedAt };
  } catch (err) {
    const e = toApiError(err);
    if (isUnavailable(e)) {
      const fetchedAt = await cacheStore.lastSynced(entity);
      if (fetchedAt !== null) {
        return { data: await cacheStore.getAll<T>(entity), source: 'cached', fetchedAt };
      }
    }
    throw e;
  }
}

export async function loadOne<T extends { id: Id }>(entity: EntityName, id: Id, fetcher: () => Promise<T>): Promise<Loaded<T>> {
  try {
    const item = await fetcher();
    await cacheStore.upsert(entity, item);
    return { data: item, source: 'live', fetchedAt: new Date().toISOString() };
  } catch (err) {
    const e = toApiError(err);
    if (isUnavailable(e)) {
      const cached = await cacheStore.get<T>(entity, id);
      if (cached) return { data: cached, source: 'cached', fetchedAt: await cacheStore.lastSynced(entity) };
    }
    throw e;
  }
}

export async function isOnline(): Promise<boolean> {
  const s = await NetInfo.fetch();
  return s.isConnected !== false && s.isInternetReachable !== false;
}

/**
 * Try to create on the server. If the network is down, queue the operation locally.
 * A timeout is ambiguous (the server may have processed it), so it is queued as
 * "unconfirmed" and is NEVER re-sent automatically.
 */
export async function createOrQueue<TReq, TRes extends { id: Id }>(
  entity: EntityName,
  payload: TReq,
  send: (payload: TReq, idempotencyKey: string) => Promise<TRes>,
): Promise<CreateResult<TRes>> {
  const opId = Crypto.randomUUID();
  if (!(await isOnline())) {
    await pendingStore.enqueue({ id: opId, entity, payload });
    return { kind: 'queued', opId, status: 'pending' };
  }
  try {
    const item = await send(payload, opId);
    await cacheStore.upsert(entity, item);
    return { kind: 'created', item };
  } catch (err) {
    const e = toApiError(err);
    if (e.kind === 'network') {
      await pendingStore.enqueue({ id: opId, entity, payload });
      return { kind: 'queued', opId, status: 'pending' };
    }
    if (e.kind === 'timeout') {
      await pendingStore.enqueue({ id: opId, entity, payload, status: 'unconfirmed', error: e.message + ' It may or may not have been saved.' });
      return { kind: 'queued', opId, status: 'unconfirmed' };
    }
    throw e;
  }
}

export function pendingToItem<T extends object>(op: PendingOperation): WithPending<T> & { id: string } {
  return {
    ...(JSON.parse(op.payload) as T),
    id: `${LOCAL_ID_PREFIX}${op.id}`,
    _pendingOpId: op.id,
    _pendingStatus: op.status,
  };
}

export const isLocalId = (id: Id): boolean => String(id).startsWith(LOCAL_ID_PREFIX);
