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
  loginLocalUser,
} from "../repositories/authRepository";
import { auth, firestore } from "../config/firebase";

import { withTimeout } from "./auth/authHelpers";
import { syncLocalUser } from "./auth/authSync";

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  let firebaseUid: string | undefined;

  try {
    const userCredential = await withTimeout(
      createUserWithEmailAndPassword(auth, payload.email, payload.password),
      3500,
      "Firebase registration timeout",
    );

    const firebaseUser = userCredential.user;
    firebaseUid = firebaseUser.uid;
    const fullName = `${payload.first_name} ${payload.last_name}`.trim();
    
    await withTimeout(
      updateProfile(firebaseUser, { displayName: fullName }),
      2500,
      "Firebase profile update timeout",
    );

    await withTimeout(
      setDoc(doc(firestore, "users", firebaseUser.uid), {
        email: payload.email,
        firstName: payload.first_name,
        lastName: payload.last_name,
        createdAt: new Date().toISOString(),
      }),
      2500,
      "Firestore setDoc timeout",
    );
  } catch (error) {
    console.warn("⚠️ [AuthService] Registro Firebase falló. Usando registro local:", error);
  }

  return registerLocalUser(payload, firebaseUid);
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  try {
    const userCredential = await withTimeout(
      signInWithEmailAndPassword(auth, payload.email, payload.password),
      3500,
      "Firebase login timeout"
    );

    try {
      return await syncLocalUser(userCredential.user, payload.email);
    } catch (syncError) {
      console.warn("⚠️ [AuthService] Error sincronizando tras login Firebase. Usando local:", syncError);
      return await loginLocalUser(payload);
    }
  } catch (error) {
    console.warn("⚠️ [AuthService] Login Firebase falló. Usando local:", error);
    return await loginLocalUser(payload);
  }
}

export async function signInWithGoogle(idToken: string): Promise<AuthResponse> {
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  const firebaseUser = userCredential.user;

  if (!firebaseUser.email) throw new Error("El usuario de Google no tiene un correo válido.");

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
