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
  const [error, setError] = useState<string | null>(null);

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

  return {
    accounts,
    transfers: sortedTransfers,
    loading,
    refreshing,
    error,
    setError,
    handleRefresh,
  };
}
