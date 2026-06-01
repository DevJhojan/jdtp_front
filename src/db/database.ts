import { SQLiteDatabase, openDatabaseAsync } from "expo-sqlite";

const DATABASE_NAME = "jdtp_finance.db";
const TARGET_SCHEMA_VERSION = 1;
export const DATABASE_SCHEMA_VERSION = TARGET_SCHEMA_VERSION;

interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

let databasePromise: Promise<SQLiteDatabase> | null = null;
let initializationPromise: Promise<void> | null = null;

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

async function applyMigrationV1(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_tokens (
      token TEXT PRIMARY KEY NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      account_type TEXT NOT NULL CHECK(account_type IN ('CASH', 'BANK', 'CARD')),
      balance TEXT NOT NULL DEFAULT '0',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category_type TEXT NOT NULL CHECK(category_type IN ('INCOME', 'EXPENSE')),
      created_at TEXT NOT NULL,
      UNIQUE(user_id, name, category_type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount TEXT NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('INCOME', 'EXPENSE')),
      description TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      from_account_id INTEGER NOT NULL,
      to_account_id INTEGER NOT NULL,
      amount TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      outgoing_transaction_id INTEGER,
      incoming_transaction_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
      FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
      FOREIGN KEY (outgoing_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
      FOREIGN KEY (incoming_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_categories_user_id_type ON categories(user_id, category_type);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id_date ON transactions(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_transfers_user_id_date ON transfers(user_id, date DESC);
  `);
}

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: "initial_finance_schema",
    up: applyMigrationV1,
  },
];

async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await createMetaTable(db);
  const currentVersion = await getSchemaVersion(db);

  if (currentVersion > TARGET_SCHEMA_VERSION) {
    throw new Error("La base de datos local tiene una version no compatible.");
  }

  const pending = MIGRATIONS.filter(
    (migration) => migration.version > currentVersion,
  ).sort((left, right) => left.version - right.version);

  for (const migration of pending) {
    if (migration.version > TARGET_SCHEMA_VERSION) {
      continue;
    }

    await migration.up(db);
    await setSchemaVersion(db, migration.version);
  }
}

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
      await runMigrations(db);
    })();
  }

  return initializationPromise;
}
