import type { SQLiteDatabase } from "expo-sqlite";

export async function applyMigrationV5(db: SQLiteDatabase): Promise<void> {
  // SQLite no permite alterar CHECK constraints directamente.
  // El procedimiento es recrear la tabla.
  // IMPORTANTE: Asegurar que los nombres de columnas y tipos coincidan exactamente con la estructura anterior.
  
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    
    BEGIN TRANSACTION;

    CREATE TABLE accounts_new (
      id INTEGER PRIMARY KEY NOT NULL,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      account_type TEXT NOT NULL CHECK(account_type IN ('CASH', 'BANK', 'CARD', 'CREDIT')),
      balance TEXT NOT NULL DEFAULT '0',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    INSERT INTO accounts_new (id, user_id, name, account_type, balance, created_at)
    SELECT id, user_id, name, account_type, balance, created_at FROM accounts;

    DROP TABLE accounts;
    ALTER TABLE accounts_new RENAME TO accounts;

    COMMIT;
    
    PRAGMA foreign_keys = ON;
  `);
}
