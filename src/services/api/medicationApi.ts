import type { LookupDto, Id, Medication, UpdateMedicationStatusRequest, CategoryDto, UpsertMedicationRequest } from '@/types/api';
import { normalizeList } from '@/utils/list';
import { getJson, http } from './client';

const base = '/api/v1/medications';
const enc = (id: Id) => encodeURIComponent(String(id));

export const medicationApi = {
  async list(): Promise<Medication[]> {
    return normalizeList<Medication>(await getJson<unknown>(base));
  },
  get(id: Id): Promise<Medication> { return getJson<Medication>(`${base}/${enc(id)}`); },
  async create(body: UpsertMedicationRequest, idempotencyKey?: string): Promise<Medication> {
    return (await http.post<Medication>(base, body, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined)).data;
  },
  async update(id: Id, body: UpsertMedicationRequest): Promise<Medication> {
    return (await http.put<Medication>(`${base}/${enc(id)}`, body)).data;
  },
  async updateStatus(id: Id, body: UpdateMedicationStatusRequest): Promise<Medication> {
    return (await http.patch<Medication>(`${base}/${enc(id)}/status`, body)).data;
  },
  async retrieveAdministrationTypes(): Promise<LookupDto[]> {
    return (await http.get<LookupDto[]>('/api/v1/medication/administration-types')).data;
  },
  async retrieveMedicationCategories(): Promise<CategoryDto[]> {
    return (await http.get<CategoryDto[]>('/api/v1/medication/categories')).data;
  },
};
