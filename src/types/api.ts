export type AccountType = "CASH" | "BANK" | "CARD";
export type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "DEBT"
  | "DEBT_PAYMENT";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface RegisterPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Account {
  id: number;
  name: string;
  account_type: AccountType;
  balance: string;
}

export interface CreateAccountPayload {
  name: string;
  account_type: AccountType;
}

export interface Category {
  id: number;
  name: string;
  category_type: TransactionType;
  owner: number | null;
}

export interface Transaction {
  id: number;
  account: number;
  account_name: string;
  category: number;
  category_name: string;
  amount: string;
  transaction_type: TransactionType;
  description: string;
  date: string;
  created_at: string;
}

export interface CreateTransactionPayload {
  account: number;
  category: number;
  amount: string;
  transaction_type: TransactionType;
  description?: string;
  date: string;
}

export interface Transfer {
  id: number;
  from_account: number;
  from_account_name: string;
  to_account: number;
  to_account_name: string;
  amount: string;
  description: string;
  date: string;
  created_at: string;
  outgoing_transaction_id: number | null;
  incoming_transaction_id: number | null;
}

export interface CreateTransferPayload {
  from_account: number;
  to_account: number;
  amount: string;
  description?: string;
  date: string;
}
