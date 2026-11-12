import { sheepApi } from '@/services/api/sheepApi';
import { pendingStore } from '@/services/database/pendingStore';
import type { CreateSheepRequest, Id, Sheep } from '@/types/api';
import type { CreateResult, Loaded, WithPending } from '@/types/app';
import { LOCAL_ID_PREFIX } from '@/types/app';
import { createOrQueue, isLocalId, loadList, loadOne, pendingToItem } from './shared';
import { LookupType } from '@/types/db';

export type SheepItem = WithPending<Sheep>;

export const sheepRepository = {
  async list(): Promise<Loaded<SheepItem[]>> {
    const loaded = await loadList<Sheep>(LookupType.SHEEP, sheepApi.list);
    const pending = (await pendingStore.list(LookupType.SHEEP)).map((op) => pendingToItem<Sheep>(op));
    return { ...loaded, data: [...pending, ...loaded.data] };
  },
  async get(id: Id): Promise<Loaded<SheepItem>> {
    if (isLocalId(id)) {
      const opId = String(id).slice(LOCAL_ID_PREFIX.length);
      const op = (await pendingStore.list(LookupType.SHEEP)).find((o) => o.id === opId);
      if (!op) throw new Error('This pending record no longer exists.');
      return { data: pendingToItem<Sheep>(op), source: 'cached', fetchedAt: null };
    }
    return loadOne<Sheep>(LookupType.SHEEP, id, () => sheepApi.get(id));
  },
  create(payload: CreateSheepRequest): Promise<CreateResult<Sheep>> {
    return createOrQueue(LookupType.SHEEP, payload, sheepApi.create);
  },
  /** Online only: the backend exposes no version/ETag, so queued status changes could silently overwrite newer data. */
  async updateStatus(id: Id, status: string): Promise<Sheep> {
    return sheepApi.updateStatus(id, { status });
  },
};
