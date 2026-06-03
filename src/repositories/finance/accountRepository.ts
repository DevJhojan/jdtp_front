import { ensureDatabaseReady, getDatabase } from "../../db/database";
import { sanitizeText } from "../financeRepository/helpers";
import { toAccount } from "../financeRepository/mappers";
import type { AccountRow } from "../financeRepository/types";
import type { Account, CreateAccountPayload } from "../../types/api";

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

export async function updateLocalAccount(
  userId: number,
  accountId: number,
  payload: CreateAccountPayload,
): Promise<Account> {
  await ensureDatabaseReady();
  const db = await getDatabase();
  const name = sanitizeText(payload.name);
  if (!name) throw new Error("El nombre es obligatorio.");

  await db.runAsync(
    "UPDATE accounts SET name = ?, account_type = ? WHERE id = ? AND user_id = ?;",
    [name, payload.account_type, accountId, userId],
  );

  const row = await db.getFirstAsync<AccountRow>(
    "SELECT id, name, account_type, balance FROM accounts WHERE id = ? AND user_id = ? LIMIT 1;",
    [accountId, userId],
  );

  if (!row) throw new Error("No se pudo actualizar la cuenta.");
  return toAccount(row);
}

export async function deleteLocalAccount(userId: number, accountId: number): Promise<void> {
  await ensureDatabaseReady();
  const db = await getDatabase();

  const transactions = await db.getAllAsync(
    "SELECT id FROM transactions WHERE account_id = ? AND user_id = ? LIMIT 1;",
    [accountId, userId],
  );
  if (transactions.length > 0) {
    throw new Error("No se puede eliminar una cuenta con movimientos asociados.");
  }

  const transfers = await db.getAllAsync(
    "SELECT id FROM transfers WHERE from_account_id = ? OR to_account_id = ? AND user_id = ? LIMIT 1;",
    [accountId, accountId, userId],
  );
  if (transfers.length > 0) {
    throw new Error("No se puede eliminar una cuenta con transferencias asociadas.");
  }

  await db.runAsync("DELETE FROM accounts WHERE id = ? AND user_id = ?;", [accountId, userId]);
}
