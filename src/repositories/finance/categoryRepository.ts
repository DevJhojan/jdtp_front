import { ensureDatabaseReady, getDatabase } from "../../db/database";
import { toCategory } from "../financeRepository/mappers";
import type { CategoryRow } from "../financeRepository/types";
import type { Category } from "../../types/api";

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
