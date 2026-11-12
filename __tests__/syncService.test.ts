/** Verifies the safety rules of the sync loop with mocked stores and APIs. */
const mockStore: Record<string, { id: string; entity: string; payload: string; status: string; error: string | null }> = {};
const mockCalls: string[] = [];
let mockNextError: unknown = null;

jest.mock('@/services/database/pendingStore', () => ({
  pendingStore: {
    list: async () => Object.values(mockStore).map((o) => ({ ...o, op: 'create', attempts: 0, createdAt: '2026-01-01' })),
    setStatus: async (id: string, status: string, error: string | null = null) => { const o = mockStore[id]; if (o) { o.status = status; o.error = error; } },
    remove: async (id: string) => { delete mockStore[id]; },
    countOpen: async () => Object.keys(mockStore).length,
    markInterruptedAsUnconfirmed: async () => undefined,
  },
}));
jest.mock('@/services/database/cacheStore', () => ({ cacheStore: { upsert: async () => undefined } }));
jest.mock('@/services/api/sheepApi', () => ({
  sheepApi: { create: async (_p: unknown, key: string) => { mockCalls.push(key); if (mockNextError) throw mockNextError; return { id: 1 }; } },
}));
jest.mock('@/services/api/medicationApi', () => ({ medicationApi: {} }));
jest.mock('@/services/api/treatmentApi', () => ({ treatmentApi: {} }));

import { ApiError } from '@/services/api/errors';
import { runSync } from '@/services/sync/syncService';

const add = (id: string, status = 'pending') => { mockStore[id] = { id, entity: 'sheep', payload: '{"tagNumber":"1"}', status, error: null }; };

beforeEach(() => { for (const k of Object.keys(mockStore)) delete mockStore[k]; mockCalls.length = 0; mockNextError = null; });

it('removes an item only after server success and sends the op id as idempotency key', async () => {
  add('a');
  const s = await runSync();
  expect(s.sent).toBe(1);
  expect(mockStore.a).toBeUndefined();
  expect(mockCalls).toEqual(['a']);
});

it('keeps the item and stops when offline', async () => {
  add('a'); add('b');
  mockNextError = new ApiError('offline', 'network');
  const s = await runSync();
  expect(s.stoppedOffline).toBe(true);
  expect(mockStore.a?.status).toBe('pending');
  expect(mockCalls).toEqual(['a']);
});

it('marks timeouts as unconfirmed and never auto-resends them', async () => {
  add('a');
  mockNextError = new ApiError('slow', 'timeout');
  await runSync();
  expect(mockStore.a?.status).toBe('unconfirmed');
  mockNextError = null;
  await runSync();
  expect(mockCalls).toEqual(['a']);
});

it('keeps 409 as conflict and other 4xx as rejected, without overwriting', async () => {
  add('a'); add('b');
  mockNextError = new ApiError('exists', 'http', 409);
  await runSync();
  expect(mockStore.a?.status).toBe('conflict');
  expect(mockStore.b?.status).toBe('conflict');
  add('c');
  mockNextError = new ApiError('bad', 'http', 422);
  await runSync();
  expect(mockStore.c?.status).toBe('rejected');
});

it('does not send non-pending items', async () => {
  add('a', 'conflict');
  await runSync();
  expect(mockCalls).toEqual([]);
});
