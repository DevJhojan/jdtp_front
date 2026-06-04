import type { SQLiteDatabase } from "expo-sqlite";

// Helper genérico para sync: compara por ID o campos clave y aplica cambios si cloud.updatedAt > local.updatedAt
async function syncEntity(
  db: SQLiteDatabase,
  userId: number,
  tableName: string,
  cloudEntities: any[],
  findLocalFn: (item: any) => Promise<any | null>,
  insertFn: (item: any) => Promise<void>,
  updateFn: (localId: number, item: any) => Promise<void>
) {
  for (const cloudItem of cloudEntities) {
    try {
        const localItem = await findLocalFn(cloudItem);
        
        if (!localItem) {
        await insertFn(cloudItem);
        } else if (new Date(cloudItem.updated_at || 0).getTime() > new Date(localItem.updated_at || 0).getTime()) {
        await updateFn(localItem.id, cloudItem);
        }
    } catch (e) {
        console.error(`❌ Error en syncEntity para ${tableName}:`, e);
    }
  }
}

export async function syncTransactionsDiff(db: SQLiteDatabase, userId: number, cloudTransactions: any[]) {
    await syncEntity(
        db, userId, "transactions", cloudTransactions,
        async (tx) => db.getFirstAsync("SELECT id, updated_at FROM transactions WHERE user_id = ? AND amount = ? AND date = ? AND transaction_type = ?", [userId, tx.amount, tx.date, tx.transaction_type]),
        async (tx) => {
            const now = new Date().toISOString();
            console.log("DEBUG: Intentando insertar transacción:", tx.description);
            const accRow = await db.getFirstAsync<{id: number}>("SELECT id FROM accounts WHERE name = ? AND user_id = ?", [tx.account_name, userId]);
            const catRow = await db.getFirstAsync<{id: number}>("SELECT id FROM categories WHERE name = ? AND user_id = ?", [tx.category_name, userId]);
            
            if (accRow && catRow) {
                await db.runAsync(`INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type, description, date, created_at, updated_at, is_deleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                    [userId, accRow.id, catRow.id, tx.amount, tx.transaction_type, tx.description, tx.date, tx.created_at || now, tx.updated_at || now, tx.is_deleted || 0]);
                console.log("✅ Transacción insertada:", tx.description);
            }
        },
        async (id, tx) => {
            await db.runAsync(`UPDATE transactions SET amount = ?, description = ?, updated_at = ?, is_deleted = ? WHERE id = ?`,
            [tx.amount, tx.description, tx.updated_at || new Date().toISOString(), tx.is_deleted || 0, id]);
        }
    );
}

export async function syncAccountsDiff(db: SQLiteDatabase, userId: number, cloudAccounts: any[]) {
    await syncEntity(
        db, userId, "accounts", cloudAccounts,
        async (acc) => db.getFirstAsync("SELECT id, updated_at FROM accounts WHERE name = ? AND user_id = ?", [acc.name, userId]),
        async (acc) => {
             const now = new Date().toISOString();
             console.log("DEBUG: Intentando insertar cuenta:", acc.name);
             await db.runAsync("INSERT INTO accounts (user_id, name, account_type, balance, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?);",
             [userId, acc.name, acc.account_type, acc.balance, acc.created_at || now, acc.updated_at || now, acc.is_deleted || 0]);
             console.log("✅ Cuenta insertada:", acc.name);
        },
        async (id, acc) => {
            await db.runAsync("UPDATE accounts SET balance = ?, updated_at = ?, is_deleted = ? WHERE id = ?", [acc.balance, acc.updated_at || new Date().toISOString(), acc.is_deleted || 0, id]);
        }
    );
}

export async function syncCategoriesDiff(db: SQLiteDatabase, userId: number, cloudCategories: any[]) {
    await syncEntity(
        db, userId, "categories", cloudCategories,
        async (cat) => db.getFirstAsync("SELECT id, updated_at FROM categories WHERE name = ? AND user_id = ?", [cat.name, userId]),
        async (cat) => {
             const now = new Date().toISOString();
             console.log("DEBUG: Intentando insertar categoría:", cat.name);
             await db.runAsync("INSERT INTO categories (user_id, name, category_type, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?);",
             [userId, cat.name, cat.category_type, cat.created_at || now, cat.updated_at || now, cat.is_deleted || 0]);
             console.log("✅ Categoría insertada:", cat.name);
        },
        async (id, cat) => {
            await db.runAsync("UPDATE categories SET updated_at = ?, is_deleted = ? WHERE id = ?", [cat.updated_at || new Date().toISOString(), cat.is_deleted || 0, id]);
        }
    );
}

export async function syncTransfersDiff(db: SQLiteDatabase, userId: number, cloudTransfers: any[]) {
    await syncEntity(
        db, userId, "transfers", cloudTransfers,
        async (tr) => db.getFirstAsync("SELECT id, updated_at FROM transfers WHERE amount = ? AND date = ? AND description = ? AND user_id = ?", [tr.amount, tr.date, tr.description, userId]),
        async (tr) => {
             const now = new Date().toISOString();
             const src = await db.getFirstAsync<{id: number}>("SELECT id FROM accounts WHERE name = ? AND user_id = ?", [tr.from_account_name, userId]);
             const dst = await db.getFirstAsync<{id: number}>("SELECT id FROM accounts WHERE name = ? AND user_id = ?", [tr.to_account_name, userId]);
             if (src && dst) {
                console.log("DEBUG: Intentando insertar transferencia:", tr.description);
                await db.runAsync("INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, description, date, created_at, updated_at, is_deleted, outgoing_transaction_id, incoming_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
                    [userId, src.id, dst.id, tr.amount, tr.description, tr.date, tr.created_at || now, tr.updated_at || now, tr.is_deleted || 0, tr.outgoing_transaction_id, tr.incoming_transaction_id]);
                console.log("✅ Transferencia insertada");
             }
        },
        async (id, tr) => {
            await db.runAsync("UPDATE transfers SET amount = ?, updated_at = ?, is_deleted = ? WHERE id = ?", [tr.amount, tr.updated_at || new Date().toISOString(), tr.is_deleted || 0, id]);
        }
    );
}

export async function syncUser(db: SQLiteDatabase, userId: number, cloudData: any, firebaseUser: any) {
  if (cloudData.user) {
    await db.runAsync(
        "UPDATE users SET first_name = ?, last_name = ? WHERE id = ?;",
        [cloudData.user.first_name, cloudData.user.last_name, userId]
    );
  }
}
