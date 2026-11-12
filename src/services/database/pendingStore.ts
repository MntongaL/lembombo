import type { EntityName, PendingOperation, PendingStatus } from '@/types/app';
import { getDb } from './db';

interface Row {
  id: string; entity: EntityName; op: 'create'; payload: string; status: PendingStatus;
  error: string | null; attempts: number; created_at: string;
}
const toOp = (r: Row): PendingOperation => ({
  id: r.id, entity: r.entity, op: r.op, payload: r.payload, status: r.status,
  error: r.error, attempts: r.attempts, createdAt: r.created_at,
});

export const pendingStore = {
  async enqueue(op: { id: string; entity: EntityName; payload: unknown; status?: PendingStatus; error?: string | null }): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR IGNORE INTO pending_ops (id, entity, op, payload, status, error, attempts, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)',
      op.id, op.entity, 'create', JSON.stringify(op.payload), op.status ?? 'pending', op.error ?? null, new Date().toISOString(),
    );
  },
  async list(entity?: EntityName): Promise<PendingOperation[]> {
    const db = await getDb();
    const rows = entity
      ? await db.getAllAsync<Row>('SELECT * FROM pending_ops WHERE entity = ? ORDER BY created_at ASC', entity)
      : await db.getAllAsync<Row>('SELECT * FROM pending_ops ORDER BY created_at ASC');
    return rows.map(toOp);
  },
  async setStatus(id: string, status: PendingStatus, error: string | null = null, bumpAttempts = false): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE pending_ops SET status = ?, error = ?, attempts = attempts + ? WHERE id = ?`,
      status, error, bumpAttempts ? 1 : 0, id,
    );
  },
  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM pending_ops WHERE id = ?', id);
  },
  /** After a crash/kill mid-request the outcome is unknown: never auto-resend those. */
  async markInterruptedAsUnconfirmed(): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE pending_ops SET status = 'unconfirmed', error = 'The app closed while this was being sent. It may or may not have reached the server.' WHERE status = 'syncing'`,
    );
  },
  async countOpen(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM pending_ops');
    return row?.n ?? 0;
  },
};
