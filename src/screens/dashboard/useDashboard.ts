import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  listAccounts,
  listTransactions,
  listTransfers,
} from "../../services/finance";
import { getApiErrorMessage } from "../../services/client";
import { syncData } from "../../services/sync";
import { useAuth } from "../../context/AuthContext";
import type { Account, Transaction, Transfer } from "../../types/api";

export function useDashboard() {
  const { refreshUser } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [nextAccounts, nextTransactions, nextTransfers] = await Promise.all([
        listAccounts(),
        listTransactions(),
        listTransfers(),
      ]);
      setAccounts(nextAccounts);
      setTransactions(nextTransactions);
      setTransfers(nextTransfers);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncData();
      await refreshUser();
      await loadData();
      Alert.alert(
        "Sincronización completa",
        "Tus datos locales y en la nube están ahora sincronizados."
      );
    } catch (syncError) {
      Alert.alert("Error de sincronización", getApiErrorMessage(syncError));
    } finally {
      setSyncing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0),
    [accounts]
  );

  const incomeTotal = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.transaction_type === "INCOME")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    [transactions]
  );

  const expenseTotal = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.transaction_type === "EXPENSE")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    [transactions]
  );

  const debtTotal = useMemo(() => {
    const debtAdditions = transactions
      .filter((t) => t.transaction_type === "DEBT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const debtPayments = transactions
      .filter((t) => t.transaction_type === "DEBT_PAYMENT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return debtAdditions - debtPayments;
  }, [transactions]);

  const netTotal = useMemo(() => totalBalance - debtTotal, [totalBalance, debtTotal]);

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
        .slice(0, 5),
    [transactions]
  );

  return {
    accounts,
    transactions,
    transfers,
    loading,
    refreshing,
    error,
    metrics: {
      totalBalance,
      incomeTotal,
      expenseTotal,
      debtTotal,
      netTotal,
    },
    recentTransactions,
    handleRefresh,
    handleSync,
    syncing,
  };
}
