import { medicationApi } from '@/services/api/medicationApi';
import { pendingStore } from '@/services/database/pendingStore';
import type { CategoryDto, Id, LookupDto } from '@/types/api';
import type { CreateResult, Loaded, WithPending } from '@/types/app';
import { LOCAL_ID_PREFIX } from '@/types/app';
import { createOrQueue, isLocalId, loadList, loadOne, pendingToItem } from './shared';
import { LookupType } from '@/types/db';

export type AdministrationTypeItem = WithPending<LookupDto>;
export type CategoryTypeItem = WithPending<CategoryDto>;


export const lookupRepository = {
  async administrationLookupItems(): Promise<Loaded<AdministrationTypeItem[]>> {
    const loaded = await loadList<LookupDto>(LookupType.ADMINISTRATION_TYPE, medicationApi.retrieveAdministrationTypes);
    const pending = (await pendingStore.list(LookupType.ADMINISTRATION_TYPE)).map((op) => pendingToItem<LookupDto>(op));
    return { ...loaded, data: [...pending, ...loaded.data] };
  },
  async categoryLookupItems(): Promise<Loaded<CategoryTypeItem[]>> {
    const loaded = await loadList<CategoryDto>(LookupType.CATEGORY_TYPE, medicationApi.retrieveMedicationCategories);
    const pending = (await pendingStore.list(LookupType.CATEGORY_TYPE)).map((op) => pendingToItem<CategoryDto>(op));
    return { ...loaded, data: [...pending, ...loaded.data] };
  },
  async get(id: Id): Promise<Loaded<CategoryTypeItem>> {
    if (isLocalId(id)) {
      const opId = String(id).slice(LOCAL_ID_PREFIX.length);
      const op = (await pendingStore.list(LookupType.CATEGORY_TYPE)).find((o) => o.id === opId);
      if (!op) throw new Error('This pending record no longer exists.');
      return { data: pendingToItem<CategoryDto>(op), source: 'cached', fetchedAt: null };
    }
    return loadOne<CategoryDto>(LookupType.CATEGORY_TYPE, id, () => medicationApi.retrieveMedicationCategories());
  },
  create(payload: CategoryDto): Promise<CreateResult<CategoryDto>> {
    return createOrQueue(LookupType.CATEGORY_TYPE, payload, medicationApi.create);
  },

  getAdminType(id: Id): Promise<Loaded<AdministrationTypeItem>> {
    if (isLocalId(id)) {
      const opId = String(id).slice(LOCAL_ID_PREFIX.length);
      const op = async () => (await pendingStore.list(LookupType.ADMINISTRATION_TYPE)).find((o) => o.id === opId);
      if (!op) throw new Error('This pending record no longer exists.');
      return { data: pendingToItem<LookupDto>(op), source: 'cached', fetchedAt: null };
    }
    return loadOne<LookupDto>(LookupType.ADMINISTRATION_TYPE, id, () => medicationApi.retrieveAdministrationTypes());
  },
  createAdminType(payload: LookupDto): Promise<CreateResult<LookupDto>> {
    return createOrQueue(LookupType.ADMINISTRATION_TYPE, payload, medicationApi.create);
  },
};
