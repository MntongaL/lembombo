import { medicationApi } from '@/services/api/medicationApi';
import { pendingStore } from '@/services/database/pendingStore';
import type { LookupDto, CategoryDto, Id, Medication, UpsertMedicationRequest, MedicationUpdate, MedicationRequestDto } from '@/types/api';
import type { CreateResult, Loaded, WithPending } from '@/types/app';
import { LOCAL_ID_PREFIX } from '@/types/app';
import { createOrQueue, isLocalId, loadList, loadOne, pendingToItem } from './shared';
import { AdministrationTypeItem, CategoryTypeItem } from './administrationTypesRepository';
import { LookupType } from '@/types/db';

export type MedicationItem = WithPending<Medication>;
export type MedicationUpdateItem = WithPending<MedicationUpdate>;

export const medicationRepository = {
  async list(): Promise<Loaded<MedicationItem[]>> {
    const loaded = await loadList<Medication>(LookupType.MEDICATION, medicationApi.list);
    const pending = (await pendingStore.list(LookupType.MEDICATION)).map((op) => pendingToItem<Medication>(op));
    return { ...loaded, data: [...pending, ...loaded.data] };
  },
  async get(id: Id): Promise<Loaded<MedicationItem>> {
    if (isLocalId(id)) {
      const opId = String(id).slice(LOCAL_ID_PREFIX.length);
      const op = (await pendingStore.list(LookupType.MEDICATION)).find((o) => o.id === opId);
      if (!op) throw new Error('This pending record no longer exists.');
      return { data: pendingToItem<Medication>(op), source: 'cached', fetchedAt: null };
    }

    return loadOne<Medication>(LookupType.MEDICATION, id, () => medicationApi.get(id));
  },
  create(payload: MedicationRequestDto): Promise<CreateResult<Medication>> {
    return createOrQueue(LookupType.MEDICATION, payload, medicationApi.create);
  },
  /** Online only (no conflict detection on PUT/PATCH). */
  update(id: Id, payload: MedicationRequestDto): Promise<Medication> { return medicationApi.update(id, payload); },
  setActive(id: Id, active: boolean): Promise<Medication> { return medicationApi.updateStatus(id, { active }); },
  async administrationTypes(): Promise<Loaded<AdministrationTypeItem[]>> {
    const loaded = await medicationApi.retrieveAdministrationTypes();
    const pending = (await pendingStore.list(LookupType.ADMINISTRATION_TYPE)).map((op) => pendingToItem<LookupDto>(op));
    return { ...loaded, data: [...pending, ...loaded.data] };
  },
};
