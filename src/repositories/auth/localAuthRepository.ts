import * as Crypto from "expo-crypto";
import { ensureDatabaseReady, getDatabase } from "../../db/database";
import type { LoginPayload, RegisterPayload, User } from "../../types/api";
import { 
  validateRegisterPayload, 
  validateLoginPayload, 
  sanitizeName, 
  bytesToHex, 
  hashPassword, 
  verifyPassword 
} from "./helpers";
import { seedDefaultCategories } from "./seed";
import { toUser } from "./userRepository";
import type { UserRow } from "./types";

export async function registerLocalUser(
  payload: RegisterPayload,
  firebaseUid?: string,
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

  const columns = [
    "email",
    "password_hash",
    "password_salt",
    "first_name",
    "last_name",
    "created_at",
  ];
  const placeholders = ["?", "?", "?", "?", "?", "?"];
  const values: Array<string> = [email, passwordHash, salt, firstName, lastName, createdAt];

  if (firebaseUid) {
    columns.push("firebase_uid");
    placeholders.push("?");
    values.push(firebaseUid);
  }

  const insertResult = await db.runAsync(
    `
      INSERT INTO users (${columns.join(", ")})
      VALUES (${placeholders.join(", ")});
    `,
    values,
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
