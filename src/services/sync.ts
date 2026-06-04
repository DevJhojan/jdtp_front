import { ref, update, get, child } from "firebase/database";
import { auth, rtdb } from "../config/firebase";
import { 
  listLocalAccounts, 
  listLocalTransactions, 
  listLocalTransfers,
  listLocalCategories,
} from "../repositories/financeRepository";
import { getCurrentUser } from "./auth";
import { getDatabase, ensureDatabaseReady } from "../db/database";
import { 
  syncAccountsDiff,
  syncCategoriesDiff,
  syncTransactionsDiff,
  syncTransfersDiff
} from "./sync/syncHelpers";

// Helper para crear un "hash" único basado en datos
const generateHash = (item: any) => {
  // Ajusta estos campos según lo que define a un registro como "único"
  // Para transacciones: amount, date, type, account, category
  // Para cuentas: name
  // Para categorías: name, type
  if (item.transaction_type) return `${item.amount}-${item.date}-${item.transaction_type}-${item.account_name}-${item.category_name}`;
  if (item.account_type) return `${item.name}`;
  if (item.category_type) return `${item.name}-${item.category_type}`;
  if (item.from_account_name) return `${item.amount}-${item.date}-${item.from_account_name}-${item.to_account_name}`;
  return JSON.stringify(item);
};

export async function syncData() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) throw new Error("No autenticado.");

  const user = await getCurrentUser();
  const userId = user.id;
  const firebaseUid = firebaseUser.uid;

  console.log("🔄 Sincronizando con Diff Checker para:", user.email);

  await ensureDatabaseReady();
  const db = await getDatabase();

  // 1. Obtener estado de la nube
  const dbRef = ref(rtdb);
  const snapshot = await get(child(dbRef, `sync/${firebaseUid}`));
  const rawCloudData = (snapshot.exists() ? snapshot.val() : {}) || {};
  const cloudData = {
      accounts: Array.isArray(rawCloudData.accounts) ? rawCloudData.accounts : [],
      transactions: Array.isArray(rawCloudData.transactions) ? rawCloudData.transactions : [],
      transfers: Array.isArray(rawCloudData.transfers) ? rawCloudData.transfers : [],
      categories: Array.isArray(rawCloudData.categories) ? rawCloudData.categories : []
  };
  console.log("DEBUG: Datos en Nube (CloudData):", JSON.stringify(cloudData));

  // 2. Obtener estado local
  const [localAccounts, localTransactions, localTransfers, localCategories] = await Promise.all([
    listLocalAccounts(userId),
    listLocalTransactions(userId),
    listLocalTransfers(userId),
    listLocalCategories(userId)
  ]);
  console.log("DEBUG: Datos Locales (Accounts):", JSON.stringify(localAccounts));

  // --- PULL: Insertar solo lo que falta en local ---
  console.log("⬇️ Aplicando PULL diferencial...");
  await syncAccountsDiff(db, userId, cloudData.accounts);
  await syncCategoriesDiff(db, userId, cloudData.categories);
  await syncTransactionsDiff(db, userId, cloudData.transactions);
  await syncTransfersDiff(db, userId, cloudData.transfers);

  // --- PUSH: Enviar solo lo nuevo a la nube ---
  console.log("⬆️ Aplicando PUSH diferencial...");

  const diffPayload = {
    accounts: localAccounts.filter(l => !cloudData.accounts.some((c: any) => generateHash(c) === generateHash(l))),
    transactions: localTransactions.filter(l => !cloudData.transactions.some((c: any) => generateHash(c) === generateHash(l))),
    transfers: localTransfers.filter(l => !cloudData.transfers.some((c: any) => generateHash(c) === generateHash(l))),
    categories: localCategories.filter(l => !cloudData.categories.some((c: any) => generateHash(c) === generateHash(l))),
    lastSync: new Date().toISOString()
  };

  const hasChanges = Object.values(diffPayload).some(arr => Array.isArray(arr) && arr.length > 0);
  
  if (hasChanges) {
    const updates: any = {};
    if (diffPayload.transactions.length > 0) updates[`sync/${firebaseUid}/transactions`] = [...(cloudData.transactions || []), ...diffPayload.transactions];
    if (diffPayload.accounts.length > 0) updates[`sync/${firebaseUid}/accounts`] = [...(cloudData.accounts || []), ...diffPayload.accounts];
    if (diffPayload.transfers.length > 0) updates[`sync/${firebaseUid}/transfers`] = [...(cloudData.transfers || []), ...diffPayload.transfers];
    if (diffPayload.categories.length > 0) updates[`sync/${firebaseUid}/categories`] = [...(cloudData.categories || []), ...diffPayload.categories];
    updates[`sync/${firebaseUid}/lastSync`] = diffPayload.lastSync;

    await update(ref(rtdb), updates);
    console.log("✅ PUSH diferencial completado.");
  } else {
    console.log("ℹ️ No hay cambios locales que sincronizar.");
  }
}
