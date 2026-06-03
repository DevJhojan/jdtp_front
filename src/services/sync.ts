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

  const user = await getCurrentUser();
  const userId = user.id;
  const firebaseUid = firebaseUser.uid;

  console.log("🔄 Iniciando sincronización para el usuario:", user.email, "Firebase UID:", firebaseUid);

  await ensureDatabaseReady();
  const db = await getDatabase();

  // --- 1. PUSH PRIMERO: Subir datos locales a la nube ---
  console.log("⬆️ Iniciando PUSH...");
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
    console.log("✅ PUSH completado.");
  } catch (pushError: any) {
    console.error("❌ Error en PUSH:", pushError);
    throw pushError;
  }

  // --- 2. PULL DESPUÉS: Descargar datos de la nube y actualizar local ---
  console.log("⬇️ Iniciando PULL...");
  const dbRef = ref(rtdb);
  let snapshot;
  try {
    snapshot = await get(child(dbRef, `sync/${firebaseUid}`));
  } catch (pullError: any) {
    console.error("❌ Error en PULL:", pullError);
    throw pullError;
  }

  if (snapshot.exists()) {
    const cloudData = snapshot.val();
    
    // Actualizar datos del usuario
    await syncUser(db, userId, cloudData, firebaseUser);
    
    // Obtener datos locales actualizados tras el PUSH
    const [updatedAccounts] = await Promise.all([
        listLocalAccounts(userId)
    ]);

    // Sincronizar Cuentas (Nota: Si el pull difiere, esto podría sobrescribir. 
    // Dado que el PUSH fue primero, esta lógica debería ser cuidadosa)
    await syncAccounts(db, userId, cloudData.accounts || [], updatedAccounts);
    const refreshedAccounts = await listLocalAccounts(userId);

    // Sincronizar Categorías
    await syncCategories(db, userId, cloudData.categories || [], await listLocalCategories(userId));
    const refreshedCategories = await listLocalCategories(userId);

    // Sincronizar Transacciones (Reemplazo destructivo)
    await syncTransactions(
      db, 
      userId, 
      cloudData.transactions || [], 
      [], // localTransactions no necesario porque limpiamos en syncTransactions
      refreshedAccounts, 
      refreshedCategories
    );

    // Sincronizar Transferencias
    // (Lógica de transferencia ya está dentro de la transacción destructiva en syncTransactions)
    console.log("✅ PULL y sincronización destructiva completados.");
  } else {
    console.log("ℹ️ No hay datos en la nube.");
  }
}
