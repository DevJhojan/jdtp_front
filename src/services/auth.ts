import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

import type { AuthResponse, LoginPayload, RegisterPayload, User } from "../types/api";
import { getAuthToken } from "./client";
import {
  getUserByToken,
  registerLocalUser,
  seedDefaultCategories,
  loginLocalUser,
} from "../repositories/authRepository";
import { auth, firestore } from "../config/firebase";
import { ensureDatabaseReady, getDatabase } from "../db/database";

// Sincronización común para login (Email o Google)
async function syncLocalUser(firebaseUser: any, email: string): Promise<AuthResponse> {
  await ensureDatabaseReady();
  const db = await getDatabase();
  
  let localUser = await db.getFirstAsync<{ id: number; email: string }>(
    "SELECT id, email FROM users WHERE email = ? LIMIT 1;",
    [email]
  );

  if (!localUser) {
    const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
    const userData = userDoc.data();

    const createdAt = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO users (email, password_hash, password_salt, first_name, last_name, created_at)
       VALUES (?, 'FIREBASE_AUTH', 'EXTERNAL', ?, ?, ?);`,
      [
        email, 
        userData?.firstName || firebaseUser.displayName?.split(' ')[0] || "Usuario", 
        userData?.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || "", 
        userData?.createdAt || createdAt
      ]
    );
    
    const newId = Number(result.lastInsertRowId);
    await seedDefaultCategories(newId);
    localUser = { id: newId, email: email };
  }

  const token = firebaseUser.uid;
  await db.runAsync(
    "INSERT OR REPLACE INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?);",
    [token, localUser.id, new Date().toISOString()]
  );

  const fullLocalUser = await db.getFirstAsync<User>(
    "SELECT id, email, first_name, last_name FROM users WHERE id = ?;",
    [localUser.id]
  );

  if (!fullLocalUser) throw new Error("Error al sincronizar perfil local.");

  return { user: fullLocalUser, token };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    ),
  ]);
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  try {
    console.log("🔥 [AuthService] Intentando registrar usuario en Firebase...");
    const userCredential = await withTimeout(
      createUserWithEmailAndPassword(auth, payload.email, payload.password),
      3500,
      "Firebase registration timeout"
    );

    const firebaseUser = userCredential.user;
    const fullName = `${payload.first_name} ${payload.last_name}`.trim();
    
    console.log("🔥 [AuthService] Actualizando perfil Firebase...");
    await withTimeout(
      updateProfile(firebaseUser, { displayName: fullName }),
      2500,
      "Firebase profile update timeout"
    );

    console.log("🔥 [AuthService] Sincronizando en Firestore...");
    await withTimeout(
      setDoc(doc(firestore, "users", firebaseUser.uid), {
        email: payload.email,
        firstName: payload.first_name,
        lastName: payload.last_name,
        createdAt: new Date().toISOString(),
      }),
      2500,
      "Firestore setDoc timeout"
    );

    console.log("🔥 [AuthService] Registro en la nube exitoso. Guardando en base local...");
  } catch (error) {
    console.warn("⚠️ [AuthService] Registro Firebase falló o tardó demasiado. Registrando únicamente en local (SQLite). Detalle:", error);
  }

  return registerLocalUser(payload);
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  try {
    console.log("🔥 [AuthService] Intentando iniciar sesión en Firebase...");
    const userCredential = await withTimeout(
      signInWithEmailAndPassword(auth, payload.email, payload.password),
      3500,
      "Firebase login timeout"
    );

    console.log("🔥 [AuthService] Login en la nube exitoso. Sincronizando con base local...");
    return await syncLocalUser(userCredential.user, payload.email);
  } catch (error) {
    console.warn("⚠️ [AuthService] Login Firebase falló o tardó demasiado. Intentando autenticación local (SQLite). Detalle:", error);
    return await loginLocalUser(payload);
  }
}

export async function signInWithGoogle(idToken: string): Promise<AuthResponse> {
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  const firebaseUser = userCredential.user;

  if (!firebaseUser.email) throw new Error("El usuario de Google no tiene un correo válido.");

  // Asegurar que existan datos en Firestore si es nuevo
  const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(firestore, "users", firebaseUser.uid), {
      email: firebaseUser.email,
      firstName: firebaseUser.displayName?.split(' ')[0] || "Usuario",
      lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
      createdAt: new Date().toISOString(),
    });
  }

  return syncLocalUser(firebaseUser, firebaseUser.email);
}

export async function getCurrentUser(): Promise<User> {
  const token = getAuthToken();
  if (!token) throw new Error("No hay sesion activa.");

  const user = await getUserByToken(token);
  if (!user) throw new Error("La sesion no es valida. Inicia sesion nuevamente.");

  return user;
}
