import * as Crypto from "expo-crypto";

import { ensureDatabaseReady, getDatabase } from "../db/database";
import type { LoginPayload, RegisterPayload, User } from "../types/api";

interface UserRow {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  password_hash: string;
  password_salt: string;
}

const DEFAULT_CATEGORY_SEED: Array<{ name: string; category_type: "INCOME" | "EXPENSE" }> = [
  { name: "Salario", category_type: "INCOME" },
  { name: "Otros ingresos", category_type: "INCOME" },
  { name: "Transferencia recibida", category_type: "INCOME" },
  { name: "Alimentacion", category_type: "EXPENSE" },
  { name: "Transporte", category_type: "EXPENSE" },
  { name: "Servicios", category_type: "EXPENSE" },
  { name: "Entretenimiento", category_type: "EXPENSE" },
  { name: "Transferencia enviada", category_type: "EXPENSE" },
  { name: "Otros gastos", category_type: "EXPENSE" },
];

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizeName(value: string | undefined): string {
  return (value ?? "").trim();
}

function toUser(row: Pick<UserRow, "id" | "email" | "first_name" | "last_name">): User {
  return {
    id: row.id,
    email: row.email,
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
  };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${password}`,
  );
}

async function verifyPassword(
  plainPassword: string,
  passwordSalt: string,
  expectedHash: string,
): Promise<boolean> {
  const hash = await hashPassword(plainPassword, passwordSalt);
  return hash === expectedHash;
}

function validateRegisterPayload(payload: RegisterPayload): { email: string; password: string } {
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

function validateLoginPayload(payload: LoginPayload): { email: string; password: string } {
  const email = sanitizeEmail(payload.email);
  const password = payload.password;

  if (!email || !password) {
    throw new Error("Debes completar correo y contraseña.");
  }

  return { email, password };
}

async function seedDefaultCategories(userId: number): Promise<void> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();

  await Promise.all(
    DEFAULT_CATEGORY_SEED.map((item) =>
      db.runAsync(
        `
          INSERT OR IGNORE INTO categories (user_id, name, category_type, created_at)
          VALUES (?, ?, ?, ?);
        `,
        [userId, item.name, item.category_type, createdAt],
      ),
    ),
  );
}

export async function registerLocalUser(
  payload: RegisterPayload,
): Promise<{ user: User; token: string }> {
  await ensureDatabaseReady();

  const { email, password } = validateRegisterPayload(payload);
  const firstName = sanitizeName(payload.first_name);
  const lastName = sanitizeName(payload.last_name);

  const db = await getDatabase();
  const existing = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM users WHERE email = ? LIMIT 1;",
    [email],
  );

  if (existing) {
    throw new Error("Ya existe una cuenta con ese correo.");
  }

  const salt = bytesToHex(Crypto.getRandomBytes(16));
  const passwordHash = await hashPassword(password, salt);
  const createdAt = new Date().toISOString();

  const insertResult = await db.runAsync(
    `
      INSERT INTO users (email, password_hash, password_salt, first_name, last_name, created_at)
      VALUES (?, ?, ?, ?, ?, ?);
    `,
    [email, passwordHash, salt, firstName, lastName, createdAt],
  );

  const userId = Number(insertResult.lastInsertRowId);
  await seedDefaultCategories(userId);

  const token = Crypto.randomUUID();
  await db.runAsync(
    "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?);",
    [token, userId, createdAt],
  );

  return {
    user: {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
    },
    token,
  };
}

export async function loginLocalUser(
  payload: LoginPayload,
): Promise<{ user: User; token: string }> {
  await ensureDatabaseReady();

  const { email, password } = validateLoginPayload(payload);
  const db = await getDatabase();

  const user = await db.getFirstAsync<UserRow>(
    `
      SELECT id, email, first_name, last_name, password_hash, password_salt
      FROM users
      WHERE email = ?
      LIMIT 1;
    `,
    [email],
  );

  if (!user) {
    throw new Error("Credenciales invalidas.");
  }

  const isValidPassword = await verifyPassword(
    password,
    user.password_salt,
    user.password_hash,
  );

  if (!isValidPassword) {
    throw new Error("Credenciales invalidas.");
  }

  const token = Crypto.randomUUID();
  await db.runAsync(
    "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?);",
    [token, user.id, new Date().toISOString()],
  );

  return {
    user: toUser(user),
    token,
  };
}

export async function getUserByToken(token: string): Promise<User | null> {
  await ensureDatabaseReady();

  const db = await getDatabase();
  const row = await db.getFirstAsync<Pick<UserRow, "id" | "email" | "first_name" | "last_name">>(
    `
      SELECT u.id, u.email, u.first_name, u.last_name
      FROM users u
      INNER JOIN auth_tokens t ON t.user_id = u.id
      WHERE t.token = ?
      LIMIT 1;
    `,
    [token],
  );

  return row ? toUser(row) : null;
}

export async function getUserById(userId: number): Promise<User | null> {
  await ensureDatabaseReady();

  const db = await getDatabase();
  const row = await db.getFirstAsync<Pick<UserRow, "id" | "email" | "first_name" | "last_name">>(
    "SELECT id, email, first_name, last_name FROM users WHERE id = ? LIMIT 1;",
    [userId],
  );

  return row ? toUser(row) : null;
}
