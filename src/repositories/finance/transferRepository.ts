import type { SQLiteDatabase } from "expo-sqlite";
import { ensureDatabaseReady, getDatabase } from "../../db/database";
import { 
  normalizeAmountString, 
  assertValidDate, 
  sanitizeText, 
  assertDifferentAccounts 
} from "../financeRepository/helpers";
import { getOwnedAccount, getCategoryByNameAndType } from "../financeRepository/ownership";
import { toTransfer } from "../financeRepository/mappers";
import type { TransferRow } from "../financeRepository/types";
import type { Transfer, CreateTransferPayload } from "../../types/api";

export async function fetchTransferRowById(db: SQLiteDatabase, transferId: number) {
  return db.getFirstAsync<TransferRow>(
    `
      SELECT
        t.id,
        t.from_account_id,
        source.name AS from_account_name,
        t.to_account_id,
        target.name AS to_account_name,
        t.amount,
        t.description,
        t.date,
        t.created_at,
        t.outgoing_transaction_id,
        t.incoming_transaction_id
      FROM transfers t
      INNER JOIN accounts source ON source.id = t.from_account_id
      INNER JOIN accounts target ON target.id = t.to_account_id
      WHERE t.id = ? AND t.is_deleted = 0
      LIMIT 1;
    `,
    [transferId],
  );
}

export async function listLocalTransfers(userId: number): Promise<Transfer[]> {
  await ensureDatabaseReady();
  const db = await getDatabase();
  const rows = await db.getAllAsync<TransferRow>(
    `
      SELECT
        t.id,
        t.from_account_id,
        source.name AS from_account_name,
        t.to_account_id,
        target.name AS to_account_name,
        t.amount,
        t.description,
        t.date,
        t.created_at,
        t.outgoing_transaction_id,
        t.incoming_transaction_id
      FROM transfers t
      INNER JOIN accounts source ON source.id = t.from_account_id
      INNER JOIN accounts target ON target.id = t.to_account_id
      WHERE t.user_id = ? AND t.is_deleted = 0
      ORDER BY t.date DESC, t.created_at DESC;
    `,
    [userId],
  );
  return rows.map(toTransfer);
}

export async function createLocalTransfer(
  userId: number,
  payload: CreateTransferPayload,
): Promise<Transfer> {
  await ensureDatabaseReady();
  const amount = normalizeAmountString(payload.amount);
  const date = assertValidDate(payload.date);
  const description = sanitizeText(payload.description);
  const now = new Date().toISOString();

  assertDifferentAccounts(payload.from_account, payload.to_account);

  const sourceAccount = await getOwnedAccount(userId, payload.from_account);
  const targetAccount = await getOwnedAccount(userId, payload.to_account);

  if (!sourceAccount || !targetAccount) {
    throw new Error("Las cuentas seleccionadas no son validas.");
  }

  const outgoingCategoryId = await getCategoryByNameAndType(userId, "Transferencia enviada", "EXPENSE");
  const incomingCategoryId = await getCategoryByNameAndType(userId, "Transferencia recibida", "INCOME");

  const db = await getDatabase();
  let transferId = 0;

  await db.withTransactionAsync(async () => {
    const outgoingResult = await db.runAsync(
      `INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type, description, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'EXPENSE', ?, ?, ?, ?);`,
      [userId, payload.from_account, outgoingCategoryId, amount, description || "Transferencia saliente", date, now, now]
    );

    const incomingResult = await db.runAsync(
      `INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type, description, date, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'INCOME', ?, ?, ?, ?);`,
      [userId, payload.to_account, incomingCategoryId, amount, description || "Transferencia entrante", date, now, now]
    );

    await db.runAsync(
      "UPDATE accounts SET balance = printf('%.2f', CAST(balance AS REAL) - ?), updated_at = ? WHERE id = ? AND user_id = ?;",
      [Number(amount), now, payload.from_account, userId]
    );

    await db.runAsync(
      "UPDATE accounts SET balance = printf('%.2f', CAST(balance AS REAL) + ?), updated_at = ? WHERE id = ? AND user_id = ?;",
      [Number(amount), now, payload.to_account, userId]
    );

    const transferResult = await db.runAsync(
      `INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, description, date, created_at, updated_at, outgoing_transaction_id, incoming_transaction_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [userId, payload.from_account, payload.to_account, amount, description, date, now, now, Number(outgoingResult.lastInsertRowId), Number(incomingResult.lastInsertRowId)]
    );

    transferId = Number(transferResult.lastInsertRowId);
  });

  const row = await fetchTransferRowById(db, transferId);
  if (!row) throw new Error("No se pudo crear la transferencia.");

  return toTransfer(row);
}
