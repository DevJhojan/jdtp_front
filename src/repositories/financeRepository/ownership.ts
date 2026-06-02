import { getDatabase } from "../../db/database";
import type { CategoryRow, AccountRow } from "./types";

export async function getOwnedAccount(userId: number, accountId: number) {
  const db = await getDatabase();
  return db.getFirstAsync<AccountRow>(
    "SELECT id, name FROM accounts WHERE id = ? AND user_id = ? LIMIT 1;",
    [accountId, userId],
  );
}

export async function getOwnedCategory(userId: number, categoryId: number) {
  const db = await getDatabase();
  return db.getFirstAsync<CategoryRow>(
    "SELECT id, name, category_type FROM categories WHERE id = ? AND user_id = ? LIMIT 1;",
    [categoryId, userId],
  );
}

export async function getCategoryByNameAndType(
  userId: number,
  name: string,
  categoryType: "INCOME" | "EXPENSE",
): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM categories WHERE user_id = ? AND name = ? AND category_type = ? LIMIT 1;",
    [userId, name, categoryType],
  );

  if (!row) {
    throw new Error(`No se encontro la categoria '${name}'.`);
  }

  return row.id;
}
