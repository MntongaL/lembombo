import { LookupType } from "./db";

export type DataSource = 'live' | 'cached';
export interface Loaded<T> { data: T; source: DataSource; fetchedAt: string | null }

export type EntityName = LookupType;
export type PendingStatus = 'pending' | 'syncing' | 'unconfirmed' | 'conflict' | 'rejected';

export interface PendingOperation {
  id: string; // client-generated operation id, also sent as Idempotency-Key
  entity: EntityName;
  op: 'create';
  payload: string; // JSON of the request DTO
  status: PendingStatus;
  error: string | null;
  attempts: number;
  createdAt: string;
}

export type CreateResult<T> =
  | { kind: 'created'; item: T }
  | { kind: 'queued'; opId: string; status: PendingStatus };

export const LOCAL_ID_PREFIX = 'local:';
export type WithPending<T> = T & { _pendingOpId?: string; _pendingStatus?: PendingStatus };
