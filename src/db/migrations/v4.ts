import type { SQLiteDatabase } from "expo-sqlite";

export async function applyMigrationV4(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    ALTER TABLE users ADD COLUMN firebase_uid TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
  `);
}
