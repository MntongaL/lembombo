import type { CreateTreatmentRequest, Id, Treatment } from '@/types/api';
import { normalizeList } from '@/utils/list';
import { getJson, http } from './client';

const base = '/api/v1/treatments';

export const treatmentApi = {
  async list(): Promise<Treatment[]> { return normalizeList<Treatment>(await getJson<unknown>(base)); },
  get(id: Id): Promise<Treatment> { return getJson<Treatment>(`${base}/${encodeURIComponent(String(id))}`); },
  async create(body: CreateTreatmentRequest, idempotencyKey?: string): Promise<Treatment> {
    return (await http.post<Treatment>(base, body, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined)).data;
  },
};
