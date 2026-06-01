import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

import type { AuthResponse, LoginPayload, RegisterPayload, User } from "../types/api";
import { getAuthToken } from "./client";
import {
  getUserByToken,
  registerLocalUser,
  seedDefaultCategories,
} from "../repositories/authRepository";
import { auth, db as firestore } from "../config/firebase";
import { ensureDatabaseReady, getDatabase } from "../db/database";

export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  // 1. Registro en Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    payload.email,
    payload.password
  );

  const firebaseUser = userCredential.user;

  // 2. Actualizar perfil en Firebase
  const fullName = `${payload.first_name} ${payload.last_name}`.trim();
  await updateProfile(firebaseUser, {
    displayName: fullName,
  });

  // 3. Guardar datos adicionales en Firestore
  await setDoc(doc(firestore, "users", firebaseUser.uid), {
    email: payload.email,
    firstName: payload.first_name,
    lastName: payload.last_name,
    createdAt: new Date().toISOString(),
  });

  // 4. Registro en base local (SQLite) para persistencia offline
  // Nota: Usamos la misma contraseña para el hash local por ahora para mantener compatibilidad
  // aunque el login principal sea Firebase.
  return registerLocalUser(payload);
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  // 1. Autenticación con Firebase
  const userCredential = await signInWithEmailAndPassword(
    auth,
    payload.email,
    payload.password
  );

  const firebaseUser = userCredential.user;

  // 2. Sincronizar/Verificar usuario local
  await ensureDatabaseReady();
  const db = await getDatabase();
  
  // Buscar si el usuario ya existe localmente por email
  let localUser = await db.getFirstAsync<{ id: number; email: string }>(
    "SELECT id, email FROM users WHERE email = ? LIMIT 1;",
    [payload.email]
  );

  if (!localUser) {
    // Si no existe localmente (ej: cambió de dispositivo), lo creamos con datos de Firestore
    const userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
    const userData = userDoc.data();

    const createdAt = new Date().toISOString();
    // Insertamos sin password_hash real ya que validamos via Firebase
    const result = await db.runAsync(
      `INSERT INTO users (email, password_hash, password_salt, first_name, last_name, created_at)
       VALUES (?, 'FIREBASE_AUTH', 'EXTERNAL', ?, ?, ?);`,
      [
        payload.email, 
        userData?.firstName || "", 
        userData?.lastName || "", 
        userData?.createdAt || createdAt
      ]
    );
    
    const newId = Number(result.lastInsertRowId);
    await seedDefaultCategories(newId);
    localUser = { id: newId, email: payload.email };
  }

  // 3. Generar token de sesión local para el Contexto
  const token = firebaseUser.uid; // Usamos el UID de Firebase como token local
  await db.runAsync(
    "INSERT OR REPLACE INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?);",
    [token, localUser.id, new Date().toISOString()]
  );

  // 4. Retornar datos del usuario
  const fullLocalUser = await db.getFirstAsync<User>(
    "SELECT id, email, first_name, last_name FROM users WHERE id = ?;",
    [localUser.id]
  );

  if (!fullLocalUser) {
    throw new Error("Error al sincronizar perfil local.");
  }

  return {
    user: fullLocalUser,
    token,
  };
}

export async function getCurrentUser(): Promise<User> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No hay sesion activa.");
  }

  const user = await getUserByToken(token);
  if (!user) {
    throw new Error("La sesion no es valida. Inicia sesion nuevamente.");
  }

  return user;
}
