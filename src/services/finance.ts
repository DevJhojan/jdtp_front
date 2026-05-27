import type {
  Account,
  Category,
  CreateAccountPayload,
  CreateTransactionPayload,
  CreateTransferPayload,
  Transaction,
  Transfer,
} from "../types/api";
import {
  createLocalAccount,
  createLocalTransaction,
  createLocalTransfer,
  listLocalAccounts,
  listLocalCategories,
  listLocalTransactions,
  listLocalTransfers,
} from "../repositories/financeRepository";
import { getCurrentUser } from "./auth";

async function getRequiredUserId(): Promise<number> {
  const user = await getCurrentUser();
  return user.id;
}

export async function listAccounts(): Promise<Account[]> {
  const userId = await getRequiredUserId();
  return listLocalAccounts(userId);
}

export async function createAccount(
  payload: CreateAccountPayload,
): Promise<Account> {
  const userId = await getRequiredUserId();
  return createLocalAccount(userId, payload);
}

export async function listCategories(): Promise<Category[]> {
  const userId = await getRequiredUserId();
  return listLocalCategories(userId);
}

export async function listTransactions(): Promise<Transaction[]> {
  const userId = await getRequiredUserId();
  return listLocalTransactions(userId);
}

export async function createTransaction(
  payload: CreateTransactionPayload,
): Promise<Transaction> {
  const userId = await getRequiredUserId();
  return createLocalTransaction(userId, payload);
}

export async function listTransfers(): Promise<Transfer[]> {
  const userId = await getRequiredUserId();
  return listLocalTransfers(userId);
}

export async function createTransfer(
  payload: CreateTransferPayload,
): Promise<Transfer> {
  const userId = await getRequiredUserId();
  return createLocalTransfer(userId, payload);
}
