import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import { getApiErrorMessage } from "../../services/client";
import {
  createTransaction,
  listAccounts,
  listCategories,
  listTransactions,
} from "../../services/finance";
import type { Account, Category, Transaction, TransactionType } from "../../types/api";
import { todayIso } from "../../utils/format";

export interface TransactionFormState {
  account: number | null;
  category: number | null;
  amount: string;
  transaction_type: TransactionType;
  description: string;
  date: string;
}

const defaultForm: TransactionFormState = {
  account: null,
  category: null,
  amount: "",
  transaction_type: "EXPENSE",
  description: "",
  date: todayIso(),
};

export function useTransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [nextTransactions, nextAccounts, nextCategories] = await Promise.all([
        listTransactions(),
        listAccounts(),
        listCategories(),
      ]);
      setTransactions(nextTransactions);
      setAccounts(nextAccounts);
      setCategories(nextCategories);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [transactions],
  );

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.transaction_type === "INCOME")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [transactions],
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.transaction_type === "EXPENSE")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0),
    [transactions],
  );
  const totalDebtPending = useMemo(() => {
    const created = transactions
      .filter((t) => t.transaction_type === "DEBT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const paid = transactions
      .filter((t) => t.transaction_type === "DEBT_PAYMENT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return created - paid;
  }, [transactions]);

  const netTotal = totalIncome - totalExpense - totalDebtPending;

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  return {
    // Data
    accounts,
    sortedTransactions,
    totalIncome,
    totalExpense,
    totalDebtPending,
    netTotal,
    // UI state
    loading,
    refreshing,
    error,
    // Actions
    handleRefresh,
  };
}
