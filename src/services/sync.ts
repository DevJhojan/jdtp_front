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
    
    // Actualizar datos del usuario en local con los de la nube
    if (cloudData.user) {
      const cloudFirstName = cloudData.user.first_name || cloudData.user.firstName;
      const cloudLastName = cloudData.user.last_name || cloudData.user.lastName;
      
      console.log("ℹ️ Datos de usuario en la nube encontrados:", { cloudFirstName, cloudLastName });

      if (cloudFirstName) {
        await db.runAsync(
          "UPDATE users SET first_name = ?, last_name = ? WHERE id = ?;",
          [cloudFirstName, cloudLastName || "", userId]
        );
        console.log("✅ Base local actualizada con nombre de la nube:", cloudFirstName, cloudLastName);
      } else if (firebaseUser.displayName) {
        // Fallback al nombre de Firebase si la nube no tiene objeto user
        const fbFirstName = firebaseUser.displayName.split(" ")[0];
        const fbLastName = firebaseUser.displayName.split(" ").slice(1).join(" ");
        await db.runAsync(
          "UPDATE users SET first_name = ?, last_name = ? WHERE id = ?;",
          [fbFirstName, fbLastName, userId]
        );
        console.log("✅ Base local actualizada con nombre de Firebase (fallback):", fbFirstName, fbLastName);
      }
    } else if (firebaseUser.displayName) {
      // Si no existe cloudData.user en absoluto, usamos el de Firebase
      const fbFirstName = firebaseUser.displayName.split(" ")[0];
      const fbLastName = firebaseUser.displayName.split(" ").slice(1).join(" ");
      await db.runAsync(
        "UPDATE users SET first_name = ?, last_name = ? WHERE id = ?;",
        [fbFirstName, fbLastName, userId]
      );
      console.log("✅ Base local actualizada con nombre de Firebase (no cloud user):", fbFirstName, fbLastName);
    }
    
    // Obtener datos locales antes de importar
    const [localAccounts, localTransactions, localTransfers, localCategories] = await Promise.all([
      listLocalAccounts(userId),
      listLocalTransactions(userId),
      listLocalTransfers(userId),
      listLocalCategories(userId)
    ]);

    // Deduplicación de Cuentas
    for (const cloudAcc of (cloudData.accounts || [])) {
      const existing = localAccounts.find(a => a.name.toLowerCase() === cloudAcc.name.toLowerCase());
      if (!existing) {
        await db.runAsync(
          "INSERT INTO accounts (user_id, name, account_type, balance, created_at) VALUES (?, ?, ?, ?, ?);",
          [userId, cloudAcc.name, cloudAcc.account_type, cloudAcc.balance, cloudAcc.created_at || new Date().toISOString()]
        );
      } else {
        await db.runAsync(
          "UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?;",
          [cloudAcc.balance, existing.id, userId]
        );
      }
    }

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
    for (const cloudTx of (cloudData.transactions || [])) {
      const targetAccount = updatedAccounts.find(a => a.name.toLowerCase() === cloudTx.account_name.toLowerCase());
      const targetCategory = updatedCategories.find(c => c.name.toLowerCase() === cloudTx.category_name.toLowerCase());

      if (!targetAccount || !targetCategory) continue;

      const isDuplicate = localTransactions.some(lt => 
        lt.date === cloudTx.date &&
        lt.amount === cloudTx.amount &&
        lt.transaction_type === cloudTx.transaction_type &&
        lt.account_name.toLowerCase() === cloudTx.account_name.toLowerCase() &&
        lt.category_name.toLowerCase() === cloudTx.category_name.toLowerCase()
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

    // Deduplicación de Transferencias
    const updatedTransfers = await listLocalTransfers(userId);
    for (const cloudTransfer of (cloudData.transfers || [])) {
      const sourceAccount = updatedAccounts.find(a => a.name.toLowerCase() === cloudTransfer.from_account_name.toLowerCase());
      const targetAccount = updatedAccounts.find(a => a.name.toLowerCase() === cloudTransfer.to_account_name.toLowerCase());

      if (!sourceAccount || !targetAccount) continue;

      const isDuplicate = updatedTransfers.some(lt => 
        lt.date === cloudTransfer.date &&
        lt.amount === cloudTransfer.amount &&
        lt.from_account_name.toLowerCase() === cloudTransfer.from_account_name.toLowerCase() &&
        lt.to_account_name.toLowerCase() === cloudTransfer.to_account_name.toLowerCase()
      );

      if (!isDuplicate) {
        console.log("ℹ️ Importando transferencia desde la nube:", cloudTransfer);
        await createLocalTransfer(userId, {
          from_account: sourceAccount.id,
          to_account: targetAccount.id,
          amount: cloudTransfer.amount,
          description: cloudTransfer.description,
          date: cloudTransfer.date,
        });
      }
    }

    console.log("✅ PULL y de-duplicación completados.");
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
