import type { SQLiteDatabase } from "expo-sqlite";
import { ensureDatabaseReady, getDatabase } from "../../db/database";
import { normalizeAmountString, assertValidDate, sanitizeText } from "../financeRepository/helpers";
import { getOwnedAccount, getOwnedCategory } from "../financeRepository/ownership";
import { toTransaction } from "../financeRepository/mappers";
import type { TransactionRow } from "../financeRepository/types";
import type { Transaction, CreateTransactionPayload } from "../../types/api";

export async function fetchTransactionRowById(db: SQLiteDatabase, transactionId: number) {
  return db.getFirstAsync<TransactionRow>(
    `
      SELECT
        t.id,
        t.account_id,
        a.name AS account_name,
        t.category_id,
        c.name AS category_name,
        t.amount,
        t.transaction_type,
        t.description,
        t.date,
        t.created_at
      FROM transactions t
      INNER JOIN accounts a ON a.id = t.account_id
      INNER JOIN categories c ON c.id = t.category_id
      WHERE t.id = ? AND t.is_deleted = 0
      LIMIT 1;
    `,
    [transactionId],
  );
}

export async function listLocalTransactions(userId: number): Promise<Transaction[]> {
  await ensureDatabaseReady();
  const db = await getDatabase();
  const rows = await db.getAllAsync<TransactionRow>(
    `
      SELECT
        t.id,
        t.account_id,
        a.name AS account_name,
        t.category_id,
        c.name AS category_name,
        t.amount,
        t.transaction_type,
        t.description,
        t.date,
        t.created_at
      FROM transactions t
      INNER JOIN accounts a ON a.id = t.account_id
      INNER JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ? AND t.is_deleted = 0
      ORDER BY t.date DESC, t.created_at DESC;
    `,
    [userId],
  );
  return rows.map(toTransaction);
}

export async function createLocalTransaction(
  userId: number,
  payload: CreateTransactionPayload,
): Promise<Transaction> {
  await ensureDatabaseReady();
  const amount = normalizeAmountString(payload.amount);
  const date = assertValidDate(payload.date);
  const description = sanitizeText(payload.description);

  const account = await getOwnedAccount(userId, payload.account);
  if (!account) throw new Error("La cuenta seleccionada no existe.");

  const category = await getOwnedCategory(userId, payload.category);
  if (!category) throw new Error("La categoria seleccionada no existe.");

  if (category.category_type !== payload.transaction_type) {
    throw new Error("La categoria no coincide con el tipo de movimiento.");
  }

  const db = await getDatabase();
  let transactionId = 0;
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    const insertResult = await db.runAsync(
      `
        INSERT INTO transactions (
          user_id, account_id, category_id, amount, transaction_type, description, date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [userId, payload.account, payload.category, amount, payload.transaction_type, description, date, now, now],
    );

    transactionId = Number(insertResult.lastInsertRowId);
    const delta =
      payload.transaction_type === "INCOME" || payload.transaction_type === "DEBT"
        ? Number(amount)
        : payload.transaction_type === "EXPENSE" || payload.transaction_type === "DEBT_PAYMENT"
          ? -Number(amount)
          : 0;

    await db.runAsync(
      `
        UPDATE accounts
        SET balance = printf('%.2f', CAST(balance AS REAL) + ?), updated_at = ?
        WHERE id = ? AND user_id = ?;
      `,
      [delta, now, payload.account, userId],
    );
  });

  const row = await fetchTransactionRowById(db, transactionId);
  if (!row) throw new Error("No se pudo crear el movimiento.");

  return toTransaction(row);
}

export async function updateLocalTransaction(
  userId: number,
  transactionId: number,
  payload: CreateTransactionPayload,
): Promise<Transaction> {
  await ensureDatabaseReady();
  const db = await getDatabase();
  const amount = normalizeAmountString(payload.amount);
  const date = assertValidDate(payload.date);
  const description = sanitizeText(payload.description);

  const oldTransaction = await fetchTransactionRowById(db, transactionId);
  if (!oldTransaction) throw new Error("Movimiento no encontrado.");

  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    // Revertir efecto en saldo antiguo
    const oldDelta =
      oldTransaction.transaction_type === "INCOME" || oldTransaction.transaction_type === "DEBT"
        ? -Number(oldTransaction.amount)
        : oldTransaction.transaction_type === "EXPENSE" || oldTransaction.transaction_type === "DEBT_PAYMENT"
          ? Number(oldTransaction.amount)
          : 0;

    await db.runAsync(
      "UPDATE accounts SET balance = printf('%.2f', CAST(balance AS REAL) + ?), updated_at = ? WHERE id = ? AND user_id = ?;",
      [oldDelta, now, oldTransaction.account_id, userId],
    );

    // Aplicar nuevo efecto
    const newDelta =
      payload.transaction_type === "INCOME" || payload.transaction_type === "DEBT"
        ? Number(amount)
        : payload.transaction_type === "EXPENSE" || payload.transaction_type === "DEBT_PAYMENT"
          ? -Number(amount)
          : 0;

    await db.runAsync(
      `UPDATE transactions SET account_id = ?, category_id = ?, amount = ?, transaction_type = ?, description = ?, date = ?, updated_at = ? WHERE id = ? AND user_id = ?;`,
      [payload.account, payload.category, amount, payload.transaction_type, description, date, now, transactionId, userId],
    );

    await db.runAsync(
      "UPDATE accounts SET balance = printf('%.2f', CAST(balance AS REAL) + ?), updated_at = ? WHERE id = ? AND user_id = ?;",
      [newDelta, now, payload.account, userId],
    );
  });

  const row = await fetchTransactionRowById(db, transactionId);
  if (!row) throw new Error("No se pudo actualizar el movimiento.");
  return toTransaction(row);
}

export async function deleteLocalTransaction(userId: number, transactionId: number): Promise<void> {
  await ensureDatabaseReady();
  const db = await getDatabase();

  const transaction = await fetchTransactionRowById(db, transactionId);
  if (!transaction) throw new Error("Movimiento no encontrado.");

  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    // Si la transacción fue INCOME o DEBT, sumó al balance, por lo tanto borrarla debe restar.
    // Si fue EXPENSE o DEBT_PAYMENT, restó del balance, por lo tanto borrarla debe sumar.
    const delta =
      transaction.transaction_type === "INCOME" || transaction.transaction_type === "DEBT"
        ? -Number(transaction.amount)
        : transaction.transaction_type === "EXPENSE" || transaction.transaction_type === "DEBT_PAYMENT"
          ? Number(transaction.amount)
          : 0;

    await db.runAsync(
      "UPDATE accounts SET balance = printf('%.2f', CAST(balance AS REAL) + ?), updated_at = ? WHERE id = ? AND user_id = ?;",
      [delta, now, transaction.account_id, userId],
    );
    await db.runAsync(
        "UPDATE transactions SET is_deleted = 1, updated_at = ? WHERE id = ? AND user_id = ?;", 
        [now, transactionId, userId]
    );
  });
}
