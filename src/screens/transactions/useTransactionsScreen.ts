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
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionFormState>(defaultForm);

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

  // Auto-select first account when accounts load
  useEffect(() => {
    if (accounts.length > 0 && form.account === null) {
      setForm((current) => ({ ...current, account: accounts[0].id }));
    }
  }, [accounts, form.account]);

  const filteredCategories = useMemo(
    () => categories.filter((cat) => cat.category_type === form.transaction_type),
    [categories, form.transaction_type],
  );

  // Auto-select/reset category when transaction type changes
  useEffect(() => {
    if (filteredCategories.length === 0) {
      if (form.category !== null) {
        setForm((current) => ({ ...current, category: null }));
      }
      return;
    }

    if (
      form.category === null ||
      !filteredCategories.some((cat) => cat.id === form.category)
    ) {
      setForm((current) => ({ ...current, category: filteredCategories[0].id }));
    }
  }, [filteredCategories, form.category]);

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

  const handleCreate = async () => {
    if (form.account === null || form.category === null) {
      setError("Debes seleccionar una cuenta y una categoría.");
      return;
    }

    setSaving(true);
    try {
      await createTransaction({
        account: form.account,
        category: form.category,
        amount: form.amount,
        transaction_type: form.transaction_type,
        description: form.description.trim() || undefined,
        date: form.date,
      });
      setForm({ ...defaultForm, account: accounts[0]?.id ?? null });
      setModalVisible(false);
      await loadData();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const openModal = () => setModalVisible(true);
  const closeModal = () => {
    if (!saving) setModalVisible(false);
  };
  const updateForm = (patch: Partial<TransactionFormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  return {
    // Data
    accounts,
    sortedTransactions,
    filteredCategories,
    totalIncome,
    totalExpense,
    totalDebtPending,
    netTotal,
    // UI state
    loading,
    refreshing,
    saving,
    modalVisible,
    error,
    form,
    // Actions
    handleRefresh,
    handleCreate,
    openModal,
    closeModal,
    updateForm,
  };
}
