import { ensureDatabaseReady, getDatabase } from "../../db/database";
import type { User } from "../../types/api";
import type { UserRow } from "./types";

export function toUser(row: Pick<UserRow, "id" | "email" | "first_name" | "last_name">): User {
  return {
    id: row.id,
    email: row.email,
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
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
