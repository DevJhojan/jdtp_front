import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { DATABASE_SCHEMA_VERSION, ensureDatabaseReady, getDatabase } from "../../db/database";
import type { BackupPayload } from "./types";
import { buildBackupFileName } from "./backupHelpers";

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
