import type { SQLiteDatabase } from "expo-sqlite";

export async function applyMigrationV6(db: SQLiteDatabase): Promise<void> {
  // SQLite no permite alterar columnas con valores por defecto no constantes.
  // Procedimiento: Añadir columnas como NULL, actualizar datos, luego establecer NOT NULL.
  await db.withTransactionAsync(async () => {
    // 1. Añadir columnas (sin restricciones NOT NULL/DEFAULT complejas)
    await db.execAsync(`
      ALTER TABLE accounts ADD COLUMN updated_at TEXT;
      ALTER TABLE accounts ADD COLUMN is_deleted INTEGER DEFAULT 0;

      ALTER TABLE categories ADD COLUMN updated_at TEXT;
      ALTER TABLE categories ADD COLUMN is_deleted INTEGER DEFAULT 0;

      ALTER TABLE transactions ADD COLUMN updated_at TEXT;
      ALTER TABLE transactions ADD COLUMN is_deleted INTEGER DEFAULT 0;

      ALTER TABLE transfers ADD COLUMN updated_at TEXT;
      ALTER TABLE transfers ADD COLUMN is_deleted INTEGER DEFAULT 0;
    `);

    // 2. Inicializar columnas existentes
    const now = new Date().toISOString();
    await db.runAsync(`UPDATE accounts SET updated_at = ?, is_deleted = 0 WHERE updated_at IS NULL;`, [now]);
    await db.runAsync(`UPDATE categories SET updated_at = ?, is_deleted = 0 WHERE updated_at IS NULL;`, [now]);
    await db.runAsync(`UPDATE transactions SET updated_at = ?, is_deleted = 0 WHERE updated_at IS NULL;`, [now]);
    await db.runAsync(`UPDATE transfers SET updated_at = ?, is_deleted = 0 WHERE updated_at IS NULL;`, [now]);

    // SQLite no tiene ALTER TABLE para añadir NOT NULL después. 
    // Para simplificar, mantenemos las columnas anulables o usamos un valor por defecto constante si es necesario.
  });
}
