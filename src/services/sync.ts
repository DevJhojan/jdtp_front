import { ref, set, get, child } from "firebase/database";
import { auth, rtdb } from "../config/firebase";
import { 
  listLocalAccounts, 
  listLocalTransactions, 
  listLocalTransfers,
  listLocalCategories,
  createLocalTransfer
} from "../repositories/financeRepository";
import { getCurrentUser } from "./auth";
import { getDatabase, ensureDatabaseReady } from "../db/database";
import { 
  syncUser, 
  syncAccounts, 
  syncCategories, 
  syncTransactions 
} from "./sync/syncHelpers";

export async function syncData() {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    throw new Error(
      "No estás autenticado con Firebase. Por favor, inicia sesión nuevamente para sincronizar tus datos con la nube."
    );
  }

  if (!firebaseUser.uid) {
    throw new Error("Error: Tu identificador de usuario de Firebase no es válido. Por favor, inicia sesión nuevamente.");
  }

  const user = await getCurrentUser();
  const userId = user.id;
  const firebaseUid = firebaseUser.uid;

  console.log("🔄 Iniciando sincronización para el usuario:", user.email, "Firebase UID:", firebaseUid);

  await ensureDatabaseReady();
  const db = await getDatabase();

  // --- 1. PULL PRIMERO: Descargar datos de la nube y de-duplicar ---
  const dbRef = ref(rtdb);
  let snapshot;
  try {
    snapshot = await get(child(dbRef, `sync/${firebaseUid}`));
  } catch (pullError: any) {
    console.error("❌ Error en PULL:", pullError);
    const errorMsg = pullError?.message || String(pullError);
    if (errorMsg.includes("Permission denied")) {
      throw new Error(
        "Permisos denegados al descargar datos. Verifica que Firebase Realtime Database tenga las reglas de seguridad correctas."
      );
    }
    throw pullError;
  }

  if (snapshot.exists()) {
    const cloudData = snapshot.val();
    
    // Actualizar datos del usuario
    await syncUser(db, userId, cloudData, firebaseUser);
    
    // Obtener datos locales antes de importar
    const [localAccounts, localTransactions, localTransfers, localCategories] = await Promise.all([
      listLocalAccounts(userId),
      listLocalTransactions(userId),
      listLocalTransfers(userId),
      listLocalCategories(userId)
    ]);

    // Sincronizar Cuentas
    await syncAccounts(db, userId, cloudData.accounts || [], localAccounts);
    const updatedAccounts = await listLocalAccounts(userId);

    // Sincronizar Categorías
    await syncCategories(db, userId, cloudData.categories || [], localCategories);
    const updatedCategories = await listLocalCategories(userId);

    // Sincronizar Transacciones
    await syncTransactions(
      db, 
      userId, 
      cloudData.transactions || [], 
      localTransactions, 
      updatedAccounts, 
      updatedCategories
    );

    // Sincronizar Transferencias
    const updatedTransfers = await listLocalTransfers(userId);
    for (const cloudTransfer of (cloudData.transfers || [])) {
      const sourceAccount = updatedAccounts.find(a => a.name.toLowerCase() === cloudTransfer.from_account_name.toLowerCase());
      const targetAccount = updatedAccounts.find(a => a.name.toLowerCase() === cloudTransfer.to_account_name.toLowerCase());

      if (!sourceAccount || !targetAccount) continue;

      console.log("ℹ️ Importando transferencia desde la nube:", cloudTransfer);
      await createLocalTransfer(userId, {
        from_account: sourceAccount.id,
        to_account: targetAccount.id,
        amount: cloudTransfer.amount,
        description: cloudTransfer.description,
        date: cloudTransfer.date,
      });
    }

    console.log("✅ PULL y sincronización destructiva completados.");
  } else {
    console.log("ℹ️ No hay datos en la nube para descargar.");
  }

  // --- 2. PUSH DESPUÉS: Subir datos locales a la nube ---
  const [localAccounts, localTransactions, localTransfers, localCategories] = await Promise.all([
    listLocalAccounts(userId),
    listLocalTransactions(userId),
    listLocalTransfers(userId),
    listLocalCategories(userId)
  ]);

  const syncPayload = {
    user: {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    },
    accounts: localAccounts,
    transactions: localTransactions,
    transfers: localTransfers,
    categories: localCategories,
    lastSync: new Date().toISOString()
  };

  try {
    await set(ref(rtdb, `sync/${firebaseUid}`), syncPayload);
    console.log("✅ PUSH completado. Datos del usuario y finanzas sincronizados.");
  } catch (pushError: any) {
    console.error("❌ Error en PUSH:", pushError);
    const errorMsg = pushError?.message || String(pushError);
    if (errorMsg.includes("Permission denied")) {
      throw new Error(
        "Permisos denegados. Verifica que Firebase Realtime Database tenga las reglas de seguridad correctas configuradas."
      );
    }
    throw pushError;
  }
}
