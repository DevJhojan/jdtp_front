import type { AccountType, TransactionType } from "../types/api";

export const accountTypeOptions: Array<{ value: AccountType; label: string }> = [
  { value: "CASH", label: "Efectivo" },
  { value: "BANK", label: "Banco" },
  { value: "CARD", label: "Tarjeta" },
];

export const transactionTypeOptions: Array<{
  value: TransactionType;
  label: string;
}> = [
  { value: "INCOME", label: "Ingreso" },
  { value: "EXPENSE", label: "Gasto" },
<<<<<<< HEAD
  { value: "DEBT", label: "Deuda"},
=======
  { value: "DEBT", label: "Deuda pendiente" },
  { value: "DEBT_PAYMENT", label: "Pago deuda" },
>>>>>>> 24d83df5fcad3355a3e66738f3da1eb74f3fe74b
];
