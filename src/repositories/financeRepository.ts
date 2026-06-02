import type { SQLiteDatabase } from "expo-sqlite";
import { ensureDatabaseReady, getDatabase } from "../db/database";
import type {
  Account,
  Category,
  CreateAccountPayload,
  CreateTransactionPayload,
  CreateTransferPayload,
  Transaction,
  Transfer,
} from "../types/api";
import {
  assertDifferentAccounts,
  assertValidDate,
  normalizeAmountString,
  sanitizeText,
} from "./financeRepository/helpers";
import {
  getCategoryByNameAndType,
  getOwnedAccount,
  getOwnedCategory,
} from "./financeRepository/ownership";
import { toAccount, toCategory, toTransaction, toTransfer } from "./financeRepository/mappers";
import type { AccountRow, CategoryRow, TransactionRow, TransferRow } from "./financeRepository/types";

async function fetchTransactionRowById(db: SQLiteDatabase, transactionId: number) {
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
      WHERE t.id = ?
      LIMIT 1;
    `,
    [transactionId],
  );
}

async function fetchTransferRowById(db: SQLiteDatabase, transferId: number) {
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
      WHERE t.id = ?
      LIMIT 1;
    `,
    [transferId],
  );
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

export async function listLocalCategories(userId: number): Promise<Category[]> {
  await ensureDatabaseReady();

  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    `
      SELECT id, name, category_type, user_id
      FROM categories
      WHERE user_id = ?
      ORDER BY category_type ASC, name COLLATE NOCASE ASC;
    `,
    [userId],
  );

  return rows.map(toCategory);
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
      WHERE t.user_id = ?
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
  if (!account) {
    throw new Error("La cuenta seleccionada no existe.");
  }

  const category = await getOwnedCategory(userId, payload.category);
  if (!category) {
    throw new Error("La categoria seleccionada no existe.");
  }

  if (category.category_type !== payload.transaction_type) {
    throw new Error("La categoria no coincide con el tipo de movimiento.");
  }

  const db = await getDatabase();
  let transactionId = 0;

  await db.withTransactionAsync(async () => {
    const createdAt = new Date().toISOString();
    const insertResult = await db.runAsync(
      `
        INSERT INTO transactions (
          user_id, account_id, category_id, amount, transaction_type, description, date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        userId,
        payload.account,
        payload.category,
        amount,
        payload.transaction_type,
        description,
        date,
        createdAt,
      ],
    );

    transactionId = Number(insertResult.lastInsertRowId);
    const delta =
      payload.transaction_type === "INCOME"
        ? Number(amount)
        : payload.transaction_type === "EXPENSE" || payload.transaction_type === "DEBT_PAYMENT"
          ? -Number(amount)
          : 0;

    await db.runAsync(
      `
        UPDATE accounts
        SET balance = printf('%.2f', CAST(balance AS REAL) + ?)
        WHERE id = ? AND user_id = ?;
      `,
      [delta, payload.account, userId],
    );
  });

  const row = await fetchTransactionRowById(db, transactionId);
  if (!row) {
    throw new Error("No se pudo crear el movimiento.");
  }

  return toTransaction(row);
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
      WHERE t.user_id = ?
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

  assertDifferentAccounts(payload.from_account, payload.to_account);

  const sourceAccount = await getOwnedAccount(userId, payload.from_account);
  const targetAccount = await getOwnedAccount(userId, payload.to_account);

  if (!sourceAccount || !targetAccount) {
    throw new Error("Las cuentas seleccionadas no son validas.");
  }

  const outgoingCategoryId = await getCategoryByNameAndType(
    userId,
    "Transferencia enviada",
    "EXPENSE",
  );
  const incomingCategoryId = await getCategoryByNameAndType(
    userId,
    "Transferencia recibida",
    "INCOME",
  );

  const db = await getDatabase();
  let transferId = 0;

  await db.withTransactionAsync(async () => {
    const createdAt = new Date().toISOString();

    const outgoingResult = await db.runAsync(
      `
        INSERT INTO transactions (
          user_id, account_id, category_id, amount, transaction_type, description, date, created_at
        ) VALUES (?, ?, ?, ?, 'EXPENSE', ?, ?, ?);
      `,
      [
        userId,
        payload.from_account,
        outgoingCategoryId,
        amount,
        description || "Transferencia saliente",
        date,
        createdAt,
      ],
    );

    const incomingResult = await db.runAsync(
      `
        INSERT INTO transactions (
          user_id, account_id, category_id, amount, transaction_type, description, date, created_at
        ) VALUES (?, ?, ?, ?, 'INCOME', ?, ?, ?);
      `,
      [
        userId,
        payload.to_account,
        incomingCategoryId,
        amount,
        description || "Transferencia entrante",
        date,
        createdAt,
      ],
    );

    await db.runAsync(
      `
        UPDATE accounts
        SET balance = printf('%.2f', CAST(balance AS REAL) - ?)
        WHERE id = ? AND user_id = ?;
      `,
      [Number(amount), payload.from_account, userId],
    );

    await db.runAsync(
      `
        UPDATE accounts
        SET balance = printf('%.2f', CAST(balance AS REAL) + ?)
        WHERE id = ? AND user_id = ?;
      `,
      [Number(amount), payload.to_account, userId],
    );

    const transferResult = await db.runAsync(
      `
        INSERT INTO transfers (
          user_id,
          from_account_id,
          to_account_id,
          amount,
          description,
          date,
          created_at,
          outgoing_transaction_id,
          incoming_transaction_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        userId,
        payload.from_account,
        payload.to_account,
        amount,
        description,
        date,
        createdAt,
        Number(outgoingResult.lastInsertRowId),
        Number(incomingResult.lastInsertRowId),
      ],
    );

    transferId = Number(transferResult.lastInsertRowId);
  });

  const row = await fetchTransferRowById(db, transferId);

  if (!row) {
    throw new Error("No se pudo crear la transferencia.");
  }

  return toTransfer(row);
}
