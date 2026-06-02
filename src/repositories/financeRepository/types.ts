export interface AccountRow {
  id: number;
  name: string;
  account_type: "CASH" | "BANK" | "CARD";
  balance: string;
}

export interface CategoryRow {
  id: number;
  name: string;
  category_type: "INCOME" | "EXPENSE" | "DEBT" | "DEBT_PAYMENT";
  user_id: number;
}

export interface TransactionRow {
  id: number;
  account_id: number;
  account_name: string;
  category_id: number;
  category_name: string;
  amount: string;
  transaction_type: "INCOME" | "EXPENSE" | "DEBT" | "DEBT_PAYMENT";
  description: string;
  date: string;
  created_at: string;
}

export interface TransferRow {
  id: number;
  from_account_id: number;
  from_account_name: string;
  to_account_id: number;
  to_account_name: string;
  amount: string;
  description: string;
  date: string;
  created_at: string;
  outgoing_transaction_id: number | null;
  incoming_transaction_id: number | null;
}
