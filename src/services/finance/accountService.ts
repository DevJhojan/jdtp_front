import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "../../config/firebase";
import { createLocalAccount, listLocalAccounts } from "../../repositories/financeRepository";
import type { Account, CreateAccountPayload } from "../../types/api";
import { getRequiredUserId } from "./financeHelpers";

export async function listAccounts(): Promise<Account[]> {
  const userId = await getRequiredUserId();
  return listLocalAccounts(userId);
}

export async function createAccount(payload: CreateAccountPayload): Promise<Account> {
  const userId = await getRequiredUserId();
  const account = await createLocalAccount(userId, payload);

  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    setDoc(doc(firestore, "users", firebaseUser.uid, "accounts", String(account.id)), {
      ...account,
      syncedAt: new Date().toISOString(),
    }).catch((err) =>
      console.warn("⚠️ [FinanceService] Fallo al sincronizar cuenta en Firebase:", err)
    );
  }

  return account;
}
