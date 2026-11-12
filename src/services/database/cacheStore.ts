import type { EntityName } from '@/types/app';
import { getDb, runExclusive } from './db';

export const cacheStore = {
  async replaceAll<T extends { id: string | number }>(entity: EntityName, items: T[]): Promise<string> {
    const db = await getDb();
    const now = new Date().toISOString();
    await runExclusive(() =>
      db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM cache WHERE entity = ?', entity);
        for (const item of items) {
          await db.runAsync('INSERT OR REPLACE INTO cache (entity, id, json) VALUES (?, ?, ?)', entity, String(item.id), JSON.stringify(item));
        }
        await db.runAsync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', `synced:${entity}`, now);
      }),
    );
    return now;
  },
  async upsert<T extends { id: string | number }>(entity: EntityName, item: T): Promise<void> {
    const db = await getDb();
    await db.runAsync('INSERT OR REPLACE INTO cache (entity, id, json) VALUES (?, ?, ?)', entity, String(item.id), JSON.stringify(item));
  },
  async getAll<T>(entity: EntityName): Promise<T[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ json: string }>('SELECT json FROM cache WHERE entity = ?', entity);
    return rows.map((r) => JSON.parse(r.json) as T);
  },
  async get<T>(entity: EntityName, id: string | number): Promise<T | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ json: string }>('SELECT json FROM cache WHERE entity = ? AND id = ?', entity, String(id));
    return row ? (JSON.parse(row.json) as T) : null;
  },
  async lastSynced(entity: EntityName): Promise<string | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', `synced:${entity}`);
    return row?.value ?? null;
  },
};
