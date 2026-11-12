import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function init(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('sheepfarm.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS cache (
      entity TEXT NOT NULL,
      id TEXT NOT NULL,
      json TEXT NOT NULL,
      PRIMARY KEY (entity, id)
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pending_ops (
      id TEXT PRIMARY KEY NOT NULL,
      entity TEXT NOT NULL,
      op TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  dbPromise = dbPromise ?? init();
  return dbPromise;
}

/** Wipe everything tied to a signed-in account (called on sign-out). */
export async function clearAllLocalData(): Promise<void> {
  const db = await getDb();
  await db.execAsync('DELETE FROM cache; DELETE FROM meta; DELETE FROM pending_ops;');
}

let chain: Promise<unknown> = Promise.resolve();

/**
 * Runs database work one job at a time. expo-sqlite shares one connection, and two overlapping
 * withTransactionAsync calls fail with "cannot start a transaction within a transaction"
 * (e.g. several screens refreshing their caches at the same moment).
 */
export function runExclusive<T>(job: () => Promise<T>): Promise<T> {
  const next = chain.then(job);
  chain = next.catch(() => undefined);
  return next;
}