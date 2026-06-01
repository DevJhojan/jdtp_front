import { ref, set, get, child } from "firebase/database";
import { auth, rtdb } from "../config/firebase";
import { 
  listLocalAccounts, 
  listLocalTransactions, 
  listLocalTransfers,
  listLocalCategories,
  createLocalAccount,
  createLocalTransaction,
  createLocalTransfer
} from "../repositories/financeRepository";
import { getCurrentUser } from "./auth";
import { getDatabase, ensureDatabaseReady } from "../db/database";

export async function syncData() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error("Debes estar autenticado en Firebase para sincronizar.");

  const user = await getCurrentUser();
  const userId = user.id;
  const firebaseUid = firebaseUser.uid;

  console.log("🔄 Iniciando sincronización para el usuario:", user.email);

  // --- 1. PUSH: Subir datos locales a la nube ---
  const [localAccounts, localTransactions, localTransfers, localCategories] = await Promise.all([
    listLocalAccounts(userId),
    listLocalTransactions(userId),
    listLocalTransfers(userId),
    listLocalCategories(userId)
  ]);

  const syncPayload = {
    accounts: localAccounts,
    transactions: localTransactions,
    transfers: localTransfers,
    categories: localCategories,
    lastSync: new Date().toISOString()
  };

  await set(ref(rtdb, `sync/${firebaseUid}`), syncPayload);
  console.log("✅ PUSH completado.");

  // --- 2. PULL: Descargar datos de la nube y de-duplicar ---
  const dbRef = ref(rtdb);
  const snapshot = await get(child(dbRef, `sync/${firebaseUid}`));

  if (!snapshot.exists()) {
    console.log("ℹ️ No hay datos en la nube para descargar.");
    return;
  }

  const cloudData = snapshot.val();
  await ensureDatabaseReady();
  const db = await getDatabase();

  // Deduplicación de Cuentas
  for (const cloudAcc of (cloudData.accounts || [])) {
    const existing = localAccounts.find(a => a.name.toLowerCase() === cloudAcc.name.toLowerCase());
    if (!existing) {
      // Si no existe, la creamos (SQLite le asignará un nuevo ID local)
      await db.runAsync(
        "INSERT INTO accounts (user_id, name, account_type, balance, created_at) VALUES (?, ?, ?, ?, ?);",
        [userId, cloudAcc.name, cloudAcc.account_type, cloudAcc.balance, cloudAcc.created_at || new Date().toISOString()]
      );
    } else {
      // Si existe, actualizamos el balance
      await db.runAsync(
        "UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?;",
        [cloudAcc.balance, existing.id, userId]
      );
    }
  }

  // Refrescar cuentas locales para tener los IDs correctos para transacciones
  const updatedAccounts = await listLocalAccounts(userId);

  // Deduplicación de Categorías
  for (const cloudCat of (cloudData.categories || [])) {
    const existing = localCategories.find(c => 
      c.name.toLowerCase() === cloudCat.name.toLowerCase() && 
      c.category_type === cloudCat.category_type
    );
    if (!existing) {
      await db.runAsync(
        "INSERT INTO categories (user_id, name, category_type, created_at) VALUES (?, ?, ?, ?);",
        [userId, cloudCat.name, cloudCat.category_type, cloudCat.created_at || new Date().toISOString()]
      );
    }
  }

  const updatedCategories = await listLocalCategories(userId);

  // Deduplicación de Transacciones
  // Criterio: misma fecha, monto, descripción, cuenta y categoría
  for (const cloudTx of (cloudData.transactions || [])) {
    const targetAccount = updatedAccounts.find(a => a.name.toLowerCase() === cloudTx.account_name.toLowerCase());
    const targetCategory = updatedCategories.find(c => c.name.toLowerCase() === cloudTx.category_name.toLowerCase());

    if (!targetAccount || !targetCategory) continue;

    const isDuplicate = localTransactions.some(lt => 
      lt.date === cloudTx.date &&
      lt.amount === cloudTx.amount &&
      lt.description === cloudTx.description &&
      lt.account_name === cloudTx.account_name &&
      lt.category_name === cloudTx.category_name
    );

    if (!isDuplicate) {
      await db.runAsync(
        `INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type, description, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          userId, 
          targetAccount.id, 
          targetCategory.id, 
          cloudTx.amount, 
          cloudTx.transaction_type, 
          cloudTx.description, 
          cloudTx.date, 
          cloudTx.created_at || new Date().toISOString()
        ]
      );
    }
  }

  console.log("✅ PULL y de-duplicación completados.");
}
