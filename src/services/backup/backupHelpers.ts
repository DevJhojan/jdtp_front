import type { BackupPayload } from "./types";

export function buildBackupFileName(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `jdtp-backup-${stamp}.json`;
}

export function assertBackupPayload(value: unknown): asserts value is BackupPayload {
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
