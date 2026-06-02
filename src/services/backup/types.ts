export interface BackupPayload {
  app: "jdtp_front";
  schemaVersion: number;
  exportedAt: string;
  users: Array<{
    id: number;
    email: string;
    password_hash: string;
    password_salt: string;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
  }>;
  auth_tokens: Array<{
    token: string;
    user_id: number;
    created_at: string;
  }>;
  accounts: Array<{
    id: number;
    user_id: number;
    name: string;
    account_type: "CASH" | "BANK" | "CARD";
    balance: string;
    created_at: string;
  }>;
  categories: Array<{
    id: number;
    user_id: number;
    name: string;
    category_type: "INCOME" | "EXPENSE";
    created_at: string;
  }>;
  transactions: Array<{
    id: number;
    user_id: number;
    account_id: number;
    category_id: number;
    amount: string;
    transaction_type: "INCOME" | "EXPENSE";
    description: string;
    date: string;
    created_at: string;
  }>;
  transfers: Array<{
    id: number;
    user_id: number;
    from_account_id: number;
    to_account_id: number;
    amount: string;
    description: string;
    date: string;
    created_at: string;
    outgoing_transaction_id: number | null;
    incoming_transaction_id: number | null;
  }>;
}
