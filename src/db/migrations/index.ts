import type { SQLiteDatabase } from "expo-sqlite";
import { applyMigrationV1 } from "./v1";
import { applyMigrationV2 } from "./v2";
import { applyMigrationV3 } from "./v3";
import { applyMigrationV4 } from "./v4";
import { applyMigrationV5 } from "./v5";
import { applyMigrationV6 } from "./v6";

export interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: "initial_finance_schema",
    up: applyMigrationV1,
  },
  {
    version: 2,
    description: "enable_debt_category_type",
    up: applyMigrationV2,
  },
  {
    version: 3,
    description: "add_debt_payment_type",
    up: applyMigrationV3,
  },
  {
    version: 4,
    description: "add_firebase_uid_to_users",
    up: applyMigrationV4,
  },
  {
    version: 5,
    description: "add_credit_account_type",
    up: applyMigrationV5,
  },
  {
    version: 6,
    description: "add_sync_columns",
    up: applyMigrationV6,
  },
];

async function createMetaTable(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}

async function getSchemaVersion(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = ?;",
    ["schema_version"],
  );

  return row ? Number(row.value) || 0 : 0;
}

async function setSchemaVersion(
  db: SQLiteDatabase,
  version: number,
): Promise<void> {
  await db.runAsync(
    `
      INSERT INTO app_meta (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value;
    `,
    ["schema_version", String(version)],
  );
}

export async function runMigrations(
  db: SQLiteDatabase,
  targetVersion: number,
): Promise<void> {
  await createMetaTable(db);
  const currentVersion = await getSchemaVersion(db);

  if (currentVersion > targetVersion) {
    throw new Error("La base de datos local tiene una version no compatible.");
  }

  const pending = MIGRATIONS.filter(
    (migration) => migration.version > currentVersion,
  ).sort((left, right) => left.version - right.version);

  for (const migration of pending) {
    if (migration.version > targetVersion) {
      continue;
    }

    await migration.up(db);
    await setSchemaVersion(db, migration.version);
  }
}
