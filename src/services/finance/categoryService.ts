import { listLocalCategories } from "../../repositories/financeRepository";
import type { Category } from "../../types/api";
import { getRequiredUserId } from "./financeHelpers";

export async function listCategories(): Promise<Category[]> {
  const userId = await getRequiredUserId();
  return listLocalCategories(userId);
}
