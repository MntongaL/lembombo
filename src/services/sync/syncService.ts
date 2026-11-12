import { medicationApi } from '@/services/api/medicationApi';
import { sheepApi } from '@/services/api/sheepApi';
import { toApiError } from '@/services/api/errors';
import { treatmentApi } from '@/services/api/treatmentApi';
import { cacheStore } from '@/services/database/cacheStore';
import { pendingStore } from '@/services/database/pendingStore';
import type { CreateSheepRequest, CreateTreatmentRequest, Id, UpsertMedicationRequest } from '@/types/api';
import type { PendingOperation } from '@/types/app';

export interface SyncSummary { sent: number; remaining: number; stoppedOffline: boolean }

async function send(op: PendingOperation): Promise<{ id: Id }> {
  const payload: unknown = JSON.parse(op.payload);
  let result: { id: Id };
  switch (op.entity) {
    case 'sheep':
      result = await sheepApi.create(payload as CreateSheepRequest, op.id);
      await cacheStore.upsert('sheep', result as { id: Id });
      return result;
    case 'medication':
      result = await medicationApi.create(payload as UpsertMedicationRequest, op.id);
      await cacheStore.upsert('medication', result as { id: Id });
      return result;
    case 'treatment':
      result = await treatmentApi.create(payload as CreateTreatmentRequest, op.id);
      await cacheStore.upsert('treatment', result as { id: Id });
      return result;
  }
}

let running: Promise<SyncSummary> | null = null;

/**
 * Sends queued creates one at a time, oldest first.
 * - An item is removed ONLY after the server confirms success (2xx).
 * - Timeouts/interruptions become "unconfirmed" and are never re-sent without the user's decision.
 * - 409 => "conflict", other 4xx => "rejected": kept for the user to review, never overwritten.
 */
export function runSync(): Promise<SyncSummary> {
  running = running ?? doSync().finally(() => { running = null; });
  return running;
}

async function doSync(): Promise<SyncSummary> {
  const ops = (await pendingStore.list()).filter((o) => o.status === 'pending');
  let sent = 0;
  let stoppedOffline = false;
  for (const op of ops) {
    await pendingStore.setStatus(op.id, 'syncing', null, true);
    try {
      await send(op);
      await pendingStore.remove(op.id);
      sent += 1;
    } catch (err) {
      const e = toApiError(err);
      if (e.kind === 'network' || e.kind === 'config') {
        await pendingStore.setStatus(op.id, 'pending', null);
        stoppedOffline = true;
        break;
      }
      if (e.kind === 'timeout') {
        await pendingStore.setStatus(op.id, 'unconfirmed', `${e.message} It may or may not have been saved.`);
        stoppedOffline = true;
        break;
      }
      if (e.kind === 'http' && (e.status ?? 0) >= 500) {
        await pendingStore.setStatus(op.id, 'pending', e.message);
        stoppedOffline = true;
        break;
      }
      await pendingStore.setStatus(op.id, e.status === 409 ? 'conflict' : 'rejected', e.message);
    }
  }
  return { sent, remaining: await pendingStore.countOpen(), stoppedOffline };
}

export const syncActions = {
  /** User confirmed they want to send an "unconfirmed" item again (may create a duplicate). */
  retry: (id: string) => pendingStore.setStatus(id, 'pending', null),
  discard: (id: string) => pendingStore.remove(id),
  recoverInterrupted: () => pendingStore.markInterruptedAsUnconfirmed(),
};
