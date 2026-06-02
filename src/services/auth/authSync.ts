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

  // 1. Buscar usuario local
  try {
    localUser = await db.getFirstAsync<LocalUserLookup>(
      "SELECT id, email, firebase_uid FROM users WHERE firebase_uid = ? LIMIT 1;",
      [firebaseUser.uid],
    );
  } catch (err) {
    console.warn("⚠️ [AuthSync] Columna firebase_uid aún no existe o error en búsqueda por UID.");
  }

  if (!localUser) {
    localUser = await db.getFirstAsync<LocalUserLookup>(
      "SELECT id, email, firebase_uid FROM users WHERE email = ? LIMIT 1;",
      [email],
    );
  }

  // 2. Actualizar UID si es necesario
  if (localUser && !localUser.firebase_uid) {
    try {
      await db.runAsync(
        "UPDATE users SET firebase_uid = ? WHERE id = ?;",
        [firebaseUser.uid, localUser.id],
      );
    } catch (err) {
      console.warn("⚠️ [AuthSync] No se pudo actualizar firebase_uid.");
    }
  }

  // 3. Crear usuario si no existe
  if (!localUser) {
    let firstName = firebaseUser.displayName?.split(" ")[0] || "Usuario";
    let lastName = firebaseUser.displayName?.split(" ").slice(1).join(" ") || "";
    let createdAt = new Date().toISOString();

    try {
      const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
      const userData = userDoc.data();
      firstName = userData?.firstName || firstName;
      lastName = userData?.lastName || lastName;
      createdAt = userData?.createdAt || createdAt;
    } catch (syncError) {
      console.warn("⚠️ [AuthSync] No se pudo leer Firestore. Usando datos básicos.");
    }

    let newId: number;
    try {
      const result = await db.runAsync(
        `INSERT INTO users (email, password_hash, password_salt, first_name, last_name, created_at, firebase_uid)
         VALUES (?, 'FIREBASE_AUTH', 'EXTERNAL', ?, ?, ?, ?);`,
        [email, firstName, lastName, createdAt, firebaseUser.uid],
      );
      newId = Number(result.lastInsertRowId);
    } catch (insertErr) {
      const result = await db.runAsync(
        `INSERT INTO users (email, password_hash, password_salt, first_name, last_name, created_at)
         VALUES (?, 'FIREBASE_AUTH', 'EXTERNAL', ?, ?, ?);`,
        [email, firstName, lastName, createdAt],
      );
      newId = Number(result.lastInsertRowId);
    }

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
