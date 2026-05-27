import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import { DATABASE_SCHEMA_VERSION, ensureDatabaseReady, getDatabase } from "../db/database";

interface BackupPayload {
  app: "jdtp_front";
  schemaVersion: number;
  exportedAt: string;
  users: Array<{
    id: number;
    email: string;
    password_hash: string;
    password_salt: string;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
  }>;
  auth_tokens: Array<{
    token: string;
    user_id: number;
    created_at: string;
  }>;
  accounts: Array<{
    id: number;
    user_id: number;
    name: string;
    account_type: "CASH" | "BANK" | "CARD";
    balance: string;
    created_at: string;
  }>;
  categories: Array<{
    id: number;
    user_id: number;
    name: string;
    category_type: "INCOME" | "EXPENSE";
    created_at: string;
  }>;
  transactions: Array<{
    id: number;
    user_id: number;
    account_id: number;
    category_id: number;
    amount: string;
    transaction_type: "INCOME" | "EXPENSE";
    description: string;
    date: string;
    created_at: string;
  }>;
  transfers: Array<{
    id: number;
    user_id: number;
    from_account_id: number;
    to_account_id: number;
    amount: string;
    description: string;
    date: string;
    created_at: string;
    outgoing_transaction_id: number | null;
    incoming_transaction_id: number | null;
  }>;
}

function buildBackupFileName(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `jdtp-backup-${stamp}.json`;
}

function assertBackupPayload(value: unknown): asserts value is BackupPayload {
  if (!value || typeof value !== "object") {
    throw new Error("El archivo no contiene un respaldo valido.");
  }

  const parsed = value as Partial<BackupPayload>;
  if (parsed.app !== "jdtp_front") {
    throw new Error("El archivo no pertenece a JDTP Front.");
  }

  const requiredArrays: Array<keyof BackupPayload> = [
    "users",
    "auth_tokens",
    "accounts",
    "categories",
    "transactions",
    "transfers",
  ];

  for (const key of requiredArrays) {
    if (!Array.isArray(parsed[key])) {
      throw new Error(`El respaldo no incluye la colección '${key}'.`);
    }
  }
}

async function collectBackupPayload(): Promise<BackupPayload> {
  await ensureDatabaseReady();
  const db = await getDatabase();

  const [users, authTokens, accounts, categories, transactions, transfers] =
    await Promise.all([
      db.getAllAsync<BackupPayload["users"][number]>(
        "SELECT id, email, password_hash, password_salt, first_name, last_name, created_at FROM users ORDER BY id ASC;",
      ),
      db.getAllAsync<BackupPayload["auth_tokens"][number]>(
        "SELECT token, user_id, created_at FROM auth_tokens ORDER BY created_at ASC;",
      ),
      db.getAllAsync<BackupPayload["accounts"][number]>(
        "SELECT id, user_id, name, account_type, balance, created_at FROM accounts ORDER BY id ASC;",
      ),
      db.getAllAsync<BackupPayload["categories"][number]>(
        "SELECT id, user_id, name, category_type, created_at FROM categories ORDER BY id ASC;",
      ),
      db.getAllAsync<BackupPayload["transactions"][number]>(
        "SELECT id, user_id, account_id, category_id, amount, transaction_type, description, date, created_at FROM transactions ORDER BY id ASC;",
      ),
      db.getAllAsync<BackupPayload["transfers"][number]>(
        "SELECT id, user_id, from_account_id, to_account_id, amount, description, date, created_at, outgoing_transaction_id, incoming_transaction_id FROM transfers ORDER BY id ASC;",
      ),
    ]);

  return {
    app: "jdtp_front",
    schemaVersion: DATABASE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    users,
    auth_tokens: authTokens,
    accounts,
    categories,
    transactions,
    transfers,
  };
}

async function writeBackupJsonToCache(payload: BackupPayload): Promise<string> {
  const basePath = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!basePath) {
    throw new Error("No se encontró una ruta de almacenamiento disponible.");
  }

  const fileUri = `${basePath}${buildBackupFileName()}`;
  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return fileUri;
}

async function saveBackupToAndroidDirectory(fileUri: string): Promise<boolean> {
  if (FileSystem.StorageAccessFramework == null) {
    return false;
  }

  const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permissions.granted) {
    return false;
  }

  const fileContent = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const targetFileUri = await FileSystem.StorageAccessFramework.createFileAsync(
    permissions.directoryUri,
    buildBackupFileName(),
    "application/json",
  );

  await FileSystem.writeAsStringAsync(targetFileUri, fileContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  return true;
}

export async function exportBackupToDevice(): Promise<void> {
  const payload = await collectBackupPayload();
  const fileUri = await writeBackupJsonToCache(payload);

  const androidSaved = await saveBackupToAndroidDirectory(fileUri);
  if (androidSaved) {
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("No se pudo compartir el archivo de respaldo en este dispositivo.");
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: "application/json",
    dialogTitle: "Exportar respaldo de JDTP",
    UTI: "public.json",
  });
}

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
          INSERT INTO accounts (id, user_id, name, account_type, balance, created_at)
          VALUES (?, ?, ?, ?, ?, ?);
        `,
        [
          account.id,
          account.user_id,
          account.name,
          account.account_type,
          account.balance,
          account.created_at,
        ],
      );
    }

    for (const category of payload.categories) {
      await db.runAsync(
        `
          INSERT INTO categories (id, user_id, name, category_type, created_at)
          VALUES (?, ?, ?, ?, ?);
        `,
        [
          category.id,
          category.user_id,
          category.name,
          category.category_type,
          category.created_at,
        ],
      );
    }

    for (const transaction of payload.transactions) {
      await db.runAsync(
        `
          INSERT INTO transactions (
            id, user_id, account_id, category_id, amount, transaction_type, description, date, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
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
            outgoing_transaction_id,
            incoming_transaction_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
