import { doc, setDoc } from "firebase/firestore";
import { auth, firestore } from "../../config/firebase";
import { 
  createLocalTransfer, 
  listLocalTransfers, 
  listLocalTransactions, 
  listLocalAccounts 
} from "../../repositories/financeRepository";
import type { Transfer, CreateTransferPayload } from "../../types/api";
import { getRequiredUserId } from "./financeHelpers";

export async function listTransfers(): Promise<Transfer[]> {
  const userId = await getRequiredUserId();
  return listLocalTransfers(userId);
}

export async function createTransfer(payload: CreateTransferPayload): Promise<Transfer> {
  const userId = await getRequiredUserId();
  const transfer = await createLocalTransfer(userId, payload);

  const firebaseUser = auth.currentUser;
  if (firebaseUser) {
    (async () => {
      try {
        await setDoc(doc(firestore, "users", firebaseUser.uid, "transfers", String(transfer.id)), {
          ...transfer,
          syncedAt: new Date().toISOString(),
        });

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
      } catch (err) {
        console.warn("⚠️ [FinanceService] Fallo al sincronizar transferencia en Firebase:", err);
      }
    })();
  }

  return transfer;
}
