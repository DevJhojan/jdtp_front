import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { ensureDatabaseReady, getDatabase } from "../../db/database";
import type { BackupPayload } from "./types";
import { assertBackupPayload } from "./backupHelpers";

async function clearDatabaseData(db: Awaited<ReturnType<typeof getDatabase>>): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM transfers;
    DELETE FROM transactions;
    DELETE FROM categories;
    DELETE FROM accounts;
    DELETE FROM auth_tokens;
    DELETE FROM users;
    PRAGMA foreign_keys = ON;
  `);
}

async function restoreBackupData(payload: BackupPayload): Promise<void> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    await clearDatabaseData(db);

    for (const user of payload.users) {
      await db.runAsync(
        `
          INSERT INTO users (id, email, password_hash, password_salt, first_name, last_name, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `,
        [
          user.id,
          user.email,
          user.password_hash,
          user.password_salt,
          user.first_name,
          user.last_name,
          user.created_at,
        ],
      );
    }

    for (const token of payload.auth_tokens) {
      await db.runAsync(
        "INSERT INTO auth_tokens (token, user_id, created_at) VALUES (?, ?, ?);",
        [token.token, token.user_id, token.created_at],
      );
    }

    for (const account of payload.accounts) {
      await db.runAsync(
        `
          INSERT INTO accounts (id, user_id, name, account_type, balance, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `,
        [
          account.id,
          account.user_id,
          account.name,
          account.account_type,
          account.balance,
          account.created_at,
          account.created_at, // Usamos created_at como valor inicial para updated_at
        ],
      );
    }

    for (const category of payload.categories) {
      await db.runAsync(
        `
          INSERT INTO categories (id, user_id, name, category_type, created_at, updated_at, is_deleted)
          VALUES (?, ?, ?, ?, ?, ?, ?);
        `,
        [
          category.id,
          category.user_id,
          category.name,
          category.category_type,
          category.created_at,
          category.created_at,
          0,
        ],
      );
    }

    for (const transaction of payload.transactions) {
      await db.runAsync(
        `
          INSERT INTO transactions (
            id, user_id, account_id, category_id, amount, transaction_type, description, date, created_at, updated_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        [
          transaction.id,
          transaction.user_id,
          transaction.account_id,
          transaction.category_id,
          transaction.amount,
          transaction.transaction_type,
          transaction.description,
          transaction.date,
          transaction.created_at,
          transaction.created_at,
          0,
        ],
      );
    }

    for (const transfer of payload.transfers) {
      await db.runAsync(
        `
          INSERT INTO transfers (
            id,
            user_id,
            from_account_id,
            to_account_id,
            amount,
            description,
            date,
            created_at,
            updated_at,
            is_deleted,
            outgoing_transaction_id,
            incoming_transaction_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        [
          transfer.id,
          transfer.user_id,
          transfer.from_account_id,
          transfer.to_account_id,
          transfer.amount,
          transfer.description,
          transfer.date,
          transfer.created_at,
          transfer.created_at,
          0,
          transfer.outgoing_transaction_id,
          transfer.incoming_transaction_id,
        ],
      );
    }
  });
}

export async function importBackupFromDevice(): Promise<boolean> {
  await ensureDatabaseReady();

  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/json"],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || result.assets.length === 0) {
    return false;
  }

  const pickedFile = result.assets[0];
  const content = await FileSystem.readAsStringAsync(pickedFile.uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("No se pudo leer el archivo de respaldo JSON.");
  }

  assertBackupPayload(parsed);
  await restoreBackupData(parsed);
  return true;
}
