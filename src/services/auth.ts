import type { AuthResponse, LoginPayload, RegisterPayload, User } from "../types/api";
import { getAuthToken } from "./client";
import {
  getUserByToken,
  loginLocalUser,
  registerLocalUser,
} from "../repositories/authRepository";

export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthResponse> {
  return registerLocalUser(payload);
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return loginLocalUser(payload);
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
