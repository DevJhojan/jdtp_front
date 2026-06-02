import type { Account, Category, Transaction, Transfer, TransactionType } from "../../types/api";
import type { AccountRow, CategoryRow, TransactionRow, TransferRow } from "./types";

function normalizeTransactionType(value: string): TransactionType {
  return value.trim().toUpperCase() as TransactionType;
}

export function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    account_type: row.account_type,
    balance: row.balance,
  };
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    category_type: normalizeTransactionType(row.category_type),
    owner: row.user_id,
  };
}

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    account: row.account_id,
    account_name: row.account_name,
    category: row.category_id,
    category_name: row.category_name,
    amount: row.amount,
    transaction_type: normalizeTransactionType(row.transaction_type),
    description: row.description,
    date: row.date,
    created_at: row.created_at,
  };
}

export function toTransfer(row: TransferRow): Transfer {
  return {
    id: row.id,
    from_account: row.from_account_id,
    from_account_name: row.from_account_name,
    to_account: row.to_account_id,
    to_account_name: row.to_account_name,
    amount: row.amount,
    description: row.description,
    date: row.date,
    created_at: row.created_at,
    outgoing_transaction_id: row.outgoing_transaction_id,
    incoming_transaction_id: row.incoming_transaction_id,
  };
}
