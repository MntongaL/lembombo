import { treatmentApi } from '@/services/api/treatmentApi';
import { cacheStore } from '@/services/database/cacheStore';
import { pendingStore } from '@/services/database/pendingStore';
import type { CreateTreatmentRequest, Id, Medication, Sheep, Treatment } from '@/types/api';
import type { CreateResult, Loaded, WithPending } from '@/types/app';
import { LOCAL_ID_PREFIX } from '@/types/app';
import { createOrQueue, isLocalId, loadList, loadOne, pendingToItem } from './shared';
import { LookupType } from '@/types/db';

export type TreatmentItem = WithPending<Treatment>;

/** Fill in display names from cached sheep/medications when the API only returns ids. */
async function enrich(items: TreatmentItem[]): Promise<TreatmentItem[]> {
  const [sheep, meds] = await Promise.all([cacheStore.getAll<Sheep>(LookupType.SHEEP), cacheStore.getAll<Medication>(LookupType.MEDICATION)]);
  const sheepById = new Map(sheep.map((s) => [String(s.id), s]));
  const medById = new Map(meds.map((m) => [String(m.id), m]));
  return items.map((t) => ({
    ...t,
    sheepTagNumber: sheepById.get(String(t.sheepId))?.tagNumber ?? '',
    sheepName: sheepById.get(String(t.sheepId))?.name ?? '',
    medicationName: medById.get(String(t.medicationId))?.name ?? '',
  }));
}

export const treatmentRepository = {
  async list(): Promise<Loaded<TreatmentItem[]>> {
    const loaded = await loadList<Treatment>(LookupType.TREATMENT, treatmentApi.list);
    const pending = (await pendingStore.list(LookupType.TREATMENT)).map((op) => pendingToItem<Treatment>(op));
    const all = [...pending, ...loaded.data].sort((a, b) => {
      const aDate = a.administeredAt ?? '';
      const bDate = b.administeredAt ?? '';
      return bDate.localeCompare(aDate);
    });
    return { ...loaded, data: await enrich(all) };
  },
  async get(id: Id): Promise<Loaded<TreatmentItem>> {
    if (isLocalId(id)) {
      const opId = String(id).slice(LOCAL_ID_PREFIX.length);
      const op = (await pendingStore.list(LookupType.TREATMENT)).find((o) => o.id === opId);
      if (!op) throw new Error('This pending record no longer exists.');
      const [item] = await enrich([pendingToItem<Treatment>(op)]);
      return { data: item as TreatmentItem, source: 'cached', fetchedAt: null };
    }
    const loaded = await loadOne<Treatment>(LookupType.TREATMENT, id, () => treatmentApi.get(id));
    const [item] = await enrich([loaded.data]);
    return { ...loaded, data: item as TreatmentItem };
  },
  /** Multiple treatments for the same sheep and date are allowed; no client-side duplicate blocking. */
  create(payload: CreateTreatmentRequest): Promise<CreateResult<Treatment>> {
    return createOrQueue(LookupType.TREATMENT, payload, treatmentApi.create);
  },
};
