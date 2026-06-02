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
  { value: "DEBT", label: "Deuda"},
];
