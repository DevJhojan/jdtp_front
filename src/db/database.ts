import { SQLiteDatabase, openDatabaseAsync } from "expo-sqlite";
import { runMigrations } from "./migrations";

const DATABASE_NAME = "jdtp_finance.db";
const TARGET_SCHEMA_VERSION = 3;
export const DATABASE_SCHEMA_VERSION = TARGET_SCHEMA_VERSION;

let databasePromise: Promise<SQLiteDatabase> | null = null;
let initializationPromise: Promise<void> | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME);
  }

  return databasePromise;
}

export async function ensureDatabaseReady(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const db = await getDatabase();
      await runMigrations(db, TARGET_SCHEMA_VERSION);
    })();
  }

  return initializationPromise;
}
