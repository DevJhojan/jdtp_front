import { doc, collection, setDoc, getDocs, query, where } from "firebase/firestore";
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
import { db as firestore, auth } from "../config/firebase";

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
  const account = await createLocalAccount(userId, payload);

  // Sincronización con Firebase
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    await setDoc(doc(firestore, "users", firebaseUser.uid, "accounts", String(account.id)), {
      ...account,
      syncedAt: new Date().toISOString(),
    });
  }

  return account;
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
  const transaction = await createLocalTransaction(userId, payload);

  // Sincronización con Firebase
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    await setDoc(doc(firestore, "users", firebaseUser.uid, "transactions", String(transaction.id)), {
      ...transaction,
      syncedAt: new Date().toISOString(),
    });
    
    // Actualizar balance de cuenta en Firebase
    const accounts = await listLocalAccounts(userId);
    const account = accounts.find(a => a.id === transaction.account);
    if (account) {
      await setDoc(doc(firestore, "users", firebaseUser.uid, "accounts", String(account.id)), {
        ...account,
        syncedAt: new Date().toISOString(),
      }, { merge: true });
    }
  }

  return transaction;
}

export async function listTransfers(): Promise<Transfer[]> {
  const userId = await getRequiredUserId();
  return listLocalTransfers(userId);
}

export async function createTransfer(
  payload: CreateTransferPayload,
): Promise<Transfer> {
  const userId = await getRequiredUserId();
  const transfer = await createLocalTransfer(userId, payload);

  // Sincronización con Firebase
  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    await setDoc(doc(firestore, "users", firebaseUser.uid, "transfers", String(transfer.id)), {
      ...transfer,
      syncedAt: new Date().toISOString(),
    });

    // Sincronizar las transacciones vinculadas (salida y entrada)
    const transactions = await listLocalTransactions(userId);
    const outgoing = transactions.find(t => t.id === transfer.outgoing_transaction_id);
    const incoming = transactions.find(t => t.id === transfer.incoming_transaction_id);

    if (outgoing) {
      await setDoc(doc(firestore, "users", firebaseUser.uid, "transactions", String(outgoing.id)), {
        ...outgoing,
        syncedAt: new Date().toISOString(),
      });
    }

    if (incoming) {
      await setDoc(doc(firestore, "users", firebaseUser.uid, "transactions", String(incoming.id)), {
        ...incoming,
        syncedAt: new Date().toISOString(),
      });
    }

    // Actualizar balances de ambas cuentas
    const accounts = await listLocalAccounts(userId);
    const fromAcc = accounts.find(a => a.id === transfer.from_account);
    const toAcc = accounts.find(a => a.id === transfer.to_account);

    if (fromAcc) {
      await setDoc(doc(firestore, "users", firebaseUser.uid, "accounts", String(fromAcc.id)), {
        ...fromAcc,
        syncedAt: new Date().toISOString(),
      }, { merge: true });
    }

    if (toAcc) {
      await setDoc(doc(firestore, "users", firebaseUser.uid, "accounts", String(toAcc.id)), {
        ...toAcc,
        syncedAt: new Date().toISOString(),
      }, { merge: true });
    }
  }

  return transfer;
}
