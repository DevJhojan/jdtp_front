import { ensureDatabaseReady, getDatabase } from "../../db/database";
import { sanitizeText } from "../financeRepository/helpers";
import { toAccount } from "../financeRepository/mappers";
import type { AccountRow } from "../financeRepository/types";
import type { Account, CreateAccountPayload } from "../../types/api";

export async function listLocalAccounts(userId: number): Promise<Account[]> {
  await ensureDatabaseReady();
  const db = await getDatabase();
  const rows = await db.getAllAsync<AccountRow>(
    `
      SELECT id, name, account_type, balance
      FROM accounts
      WHERE user_id = ?
      ORDER BY name COLLATE NOCASE ASC;
    `,
    [userId],
  );
  return rows.map(toAccount);
}

export async function createLocalAccount(
  userId: number,
  payload: CreateAccountPayload,
): Promise<Account> {
  await ensureDatabaseReady();
  const name = sanitizeText(payload.name);
  if (!name) {
    throw new Error("El nombre de la cuenta es obligatorio.");
  }

  const createdAt = new Date().toISOString();
  const db = await getDatabase();
  const result = await db.runAsync(
    `
      INSERT INTO accounts (user_id, name, account_type, balance, created_at)
      VALUES (?, ?, ?, '0', ?);
    `,
    [userId, name, payload.account_type, createdAt],
  );

  const row = await db.getFirstAsync<AccountRow>(
    "SELECT id, name, account_type, balance FROM accounts WHERE id = ? LIMIT 1;",
    [Number(result.lastInsertRowId)],
  );

  if (!row) {
    throw new Error("No se pudo crear la cuenta.");
  }

  return toAccount(row);
}
