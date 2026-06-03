import * as Crypto from "expo-crypto";
import type { LoginPayload, RegisterPayload } from "../../types/api";

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizeName(value: string | undefined): string {
  return (value ?? "").trim();
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
}

export async function verifyPassword(
  plainPassword: string,
  passwordSalt: string,
  expectedHash: string,
): Promise<boolean> {
  const hash = await hashPassword(plainPassword, passwordSalt);
  return hash === expectedHash;
}

export function validateRegisterPayload(payload: RegisterPayload): { email: string; password: string } {
  const email = sanitizeEmail(payload.email);
  const password = payload.password.trim();

  if (!email.includes("@")) {
    throw new Error("Debes ingresar un correo valido.");
  }

  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  return { email, password };
}

export function validateLoginPayload(payload: LoginPayload): { email: string; password: string } {
  const email = sanitizeEmail(payload.email);
  const password = payload.password;

  if (!email || !password) {
    throw new Error("Debes completar correo y contraseña.");
  }

  return { email, password };
}
