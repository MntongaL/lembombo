import { pendingStore } from '@/services/database/pendingStore';
import { syncActions } from '@/services/sync/syncService';
import type { PendingOperation } from '@/types/app';

export const pendingRepository = {
  list: (): Promise<PendingOperation[]> => pendingStore.list(),
  /** Re-queue an "unconfirmed" item. May create a duplicate if the first attempt actually succeeded. */
  resend: (id: string) => syncActions.retry(id),
  discard: (id: string) => syncActions.discard(id),
};
