import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "../../config/firebase";
import { 
  createLocalTransaction, 
  listLocalTransactions, 
  listLocalAccounts 
} from "../../repositories/financeRepository";
import type { Transaction, CreateTransactionPayload } from "../../types/api";
import { getRequiredUserId } from "./financeHelpers";

export async function listTransactions(): Promise<Transaction[]> {
  const userId = await getRequiredUserId();
  return listLocalTransactions(userId);
}

export async function createTransaction(payload: CreateTransactionPayload): Promise<Transaction> {
  const userId = await getRequiredUserId();
  const transaction = await createLocalTransaction(userId, payload);

  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    (async () => {
      try {
        await setDoc(doc(firestore, "users", firebaseUser.uid, "transactions", String(transaction.id)), {
          ...transaction,
          syncedAt: new Date().toISOString(),
        });
        
        const accounts = await listLocalAccounts(userId);
        const account = accounts.find(a => a.id === transaction.account);
        if (account) {
          await setDoc(doc(firestore, "users", firebaseUser.uid, "accounts", String(account.id)), {
            ...account,
            syncedAt: new Date().toISOString(),
          }, { merge: true });
        }
      } catch (err) {
        console.warn("⚠️ [FinanceService] Fallo al sincronizar transacción en Firebase:", err);
      }
    })();
  }

  return transaction;
}
