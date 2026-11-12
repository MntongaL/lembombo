import type { CreateSheepRequest, Id, Sheep, UpdateSheepStatusRequest } from '@/types/api';
import { normalizeList } from '@/utils/list';
import { getJson, http } from './client';

export const sheepApi = {
  async list(): Promise<Sheep[]> {
    return normalizeList<Sheep>(await getJson<unknown>('/api/v1/sheep'));
  },
  get(id: Id): Promise<Sheep> { return getJson<Sheep>(`/api/v1/sheep/${encodeURIComponent(String(id))}`); },
  async create(body: CreateSheepRequest, idempotencyKey?: string): Promise<Sheep> {
    return (await http.post<Sheep>('/api/v1/sheep', body, idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined)).data;
  },
  async updateStatus(id: Id, body: UpdateSheepStatusRequest): Promise<Sheep> {
    return (await http.patch<Sheep>(`/api/v1/sheep/${encodeURIComponent(String(id))}/status`, body)).data;
  },
};
