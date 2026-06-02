import type { SQLiteDatabase } from "expo-sqlite";

export async function applyMigrationV2(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;

    CREATE TABLE IF NOT EXISTS categories_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category_type TEXT NOT NULL CHECK(category_type IN ('INCOME', 'EXPENSE', 'DEBT', 'DEBT_PAYMENT')),
      created_at TEXT NOT NULL,
      UNIQUE(user_id, name, category_type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    INSERT INTO categories_new (id, user_id, name, category_type, created_at)
    SELECT id, user_id, name, category_type, created_at FROM categories;

    DROP TABLE categories;
    ALTER TABLE categories_new RENAME TO categories;

    CREATE TABLE IF NOT EXISTS transactions_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      amount TEXT NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('INCOME', 'EXPENSE', 'DEBT', 'DEBT_PAYMENT')),
      description TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
    );

    INSERT INTO transactions_new (id, user_id, account_id, category_id, amount, transaction_type, description, date, created_at)
    SELECT id, user_id, account_id, category_id, amount, transaction_type, description, date, created_at FROM transactions;

    DROP TABLE transactions;
    ALTER TABLE transactions_new RENAME TO transactions;

    CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
    CREATE INDEX IF NOT EXISTS idx_categories_user_id_type ON categories(user_id, category_type);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_id_date ON transactions(user_id, date DESC);
    CREATE INDEX IF NOT EXISTS idx_transfers_user_id_date ON transfers(user_id, date DESC);

    PRAGMA foreign_keys = ON;
  `);

  const timestamp = new Date().toISOString();
  const debtCategories = [
    "Pago de préstamo",
    "Intereses",
    "Deuda compartida",
    "Crédito pendiente",
  ];

  for (const name of debtCategories) {
    await db.runAsync(
      `
      INSERT OR IGNORE INTO categories (user_id, name, category_type, created_at)
      SELECT id, ?, 'DEBT', ? FROM users;
      `,
      [name, timestamp],
    );
  }
}
