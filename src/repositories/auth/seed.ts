import { getDatabase } from "../../db/database";

export const DEFAULT_CATEGORY_SEED: Array<{ name: string; category_type: "INCOME" | "EXPENSE" | "DEBT" | "DEBT_PAYMENT" }> = [
  { name: "Salario", category_type: "INCOME" },
  { name: "Otros ingresos", category_type: "INCOME" },
  { name: "Transferencia recibida", category_type: "INCOME" },
  { name: "Alimentacion", category_type: "EXPENSE" },
  { name: "Transporte", category_type: "EXPENSE" },
  { name: "Servicios", category_type: "EXPENSE" },
  { name: "Entretenimiento", category_type: "EXPENSE" },
  { name: "Transferencia enviada", category_type: "EXPENSE" },
  { name: "Otros gastos", category_type: "EXPENSE" },
  { name: "Préstamo pendiente", category_type: "DEBT" },
  { name: "Tarjeta de crédito", category_type: "DEBT" },
  { name: "Pago de deuda", category_type: "DEBT_PAYMENT" },
  { name: "Abono a préstamo", category_type: "DEBT_PAYMENT" },
];

export async function seedDefaultCategories(userId: number): Promise<void> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();

  await Promise.all(
    DEFAULT_CATEGORY_SEED.map((item) =>
      db.runAsync(
        `
          INSERT OR IGNORE INTO categories (user_id, name, category_type, created_at)
          VALUES (?, ?, ?, ?);
        `,
        [userId, item.name, item.category_type, createdAt],
      ),
    ),
  );
}
