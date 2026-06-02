import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { listAccounts, listTransfers, createTransfer } from "../../services/finance";
import { getApiErrorMessage } from "../../services/client";
import type { Account, Transfer } from "../../types/api";
import { todayIso } from "../../utils/format";

export interface TransferFormState {
  from_account: number | null;
  to_account: number | null;
  amount: string;
  description: string;
  date: string;
}

const defaultForm: TransferFormState = {
  from_account: null,
  to_account: null,
  amount: "",
  description: "",
  date: todayIso(),
};

export function useTransfers() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TransferFormState>(defaultForm);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [nextAccounts, nextTransfers] = await Promise.all([
        listAccounts(),
        listTransfers(),
      ]);
      setAccounts(nextAccounts);
      setTransfers(nextTransfers);
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

  useEffect(() => {
    if (accounts.length === 0) return;

    setForm((current) => {
      const nextFrom = current.from_account ?? accounts[0].id;
      const nextToCandidate = accounts.find((account) => account.id !== nextFrom);
      const nextTo = current.to_account ?? nextToCandidate?.id ?? null;

      if (nextFrom === current.from_account && nextTo === current.to_account) {
        return current;
      }

      return {
        ...current,
        from_account: nextFrom,
        to_account: nextTo,
      };
    });
  }, [accounts]);

  const sortedTransfers = useMemo(
    () =>
      [...transfers].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
    [transfers],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleCreate = async () => {
    if (form.from_account === null || form.to_account === null) {
      setError("Debes seleccionar cuentas de origen y destino.");
      return;
    }

    if (form.from_account === form.to_account) {
      setError("La cuenta de origen y destino deben ser diferentes.");
      return;
    }

    setSaving(true);
    try {
      await createTransfer({
        from_account: form.from_account,
        to_account: form.to_account,
        amount: form.amount,
        description: form.description.trim() || undefined,
        date: form.date,
      });
      setForm({
        ...defaultForm,
        from_account: accounts[0]?.id ?? null,
        to_account: accounts[1]?.id ?? null,
      });
      setModalVisible(false);
      await loadData();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return {
    accounts,
    transfers: sortedTransfers,
    loading,
    refreshing,
    saving,
    modalVisible,
    setModalVisible,
    error,
    setError,
    form,
    setForm,
    handleRefresh,
    handleCreate,
  };
}
