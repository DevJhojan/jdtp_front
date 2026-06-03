import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../../config/firebase";
import { ensureDatabaseReady, getDatabase } from "../../db/database";
import { seedDefaultCategories } from "../../repositories/authRepository";
import type { AuthResponse, User } from "../../types/api";

type LocalUserLookup = { id: number; email: string; firebase_uid?: string | null };

export async function syncLocalUser(firebaseUser: any, email: string): Promise<AuthResponse> {
  await ensureDatabaseReady();
  const db = await getDatabase();

  let localUser: LocalUserLookup | null = null;

  // 1. Buscar usuario local (por UID o Email)
  localUser = await db.getFirstAsync<LocalUserLookup>(
    "SELECT id, email, firebase_uid FROM users WHERE firebase_uid = ? OR email = ? LIMIT 1;",
    [firebaseUser.uid, email.trim().toLowerCase()],
  );

  // 2. Actualizar UID si el usuario existe pero no tiene el ID de Firebase vinculado
  if (localUser && !localUser.firebase_uid) {
    console.log("ℹ️ [AuthSync] Vinculando firebase_uid al usuario local existente.");
    await db.runAsync(
      "UPDATE users SET firebase_uid = ? WHERE id = ?;",
      [firebaseUser.uid, localUser.id],
    );
  }

  // 3. Crear usuario local si es la primera vez en este dispositivo
  if (!localUser) {
    console.log("ℹ️ [AuthSync] Creando nuevo usuario local desde datos de Firebase.");
    let firstName = firebaseUser.displayName?.split(" ")[0] || "Usuario";
    let lastName = firebaseUser.displayName?.split(" ").slice(1).join(" ") || "";
    let createdAt = new Date().toISOString();

    try {
      const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
      const userData = userDoc.data();
      if (userData) {
        firstName = userData.firstName || userData.first_name || firstName;
        lastName = userData.lastName || userData.last_name || lastName;
        createdAt = userData.createdAt || userData.created_at || createdAt;
      }
    } catch (syncError) {
      console.warn("⚠️ [AuthSync] No se pudo leer Firestore, usando datos básicos de Firebase.");
    }

    const result = await db.runAsync(
      `INSERT INTO users (email, password_hash, password_salt, first_name, last_name, created_at, firebase_uid)
       VALUES (?, 'FIREBASE_AUTH', 'EXTERNAL', ?, ?, ?, ?);`,
      [email.trim().toLowerCase(), firstName, lastName, createdAt, firebaseUser.uid],
    );
    
    const newId = Number(result.lastInsertRowId);
    await seedDefaultCategories(newId);
    localUser = { id: newId, email };
  }

  // 4. Gestionar token de sesión
  const token = firebaseUser.uid;
  await db.runAsync(
    "INSERT OR REPLACE INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?);",
    [token, localUser.id, new Date().toISOString()],
  );

  const fullLocalUser = await db.getFirstAsync<User>(
    "SELECT id, email, first_name, last_name FROM users WHERE id = ?;",
    [localUser.id]
  );

  if (!fullLocalUser) throw new Error("Error al sincronizar perfil local.");

  return { user: fullLocalUser, token };
}
