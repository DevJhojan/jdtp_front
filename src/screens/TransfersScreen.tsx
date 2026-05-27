import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { ActionButton } from "../components/ActionButton";
import { AppScreen } from "../components/AppScreen";
import { EmptyState } from "../components/EmptyState";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { FormField } from "../components/FormField";
import { LoadingState } from "../components/LoadingState";
import { ModalSheet } from "../components/ModalSheet";
import { OptionSelector } from "../components/OptionSelector";
import { useAppTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/client";
import {
  createTransfer,
  listAccounts,
  listTransfers,
} from "../services/finance";
import type { Account, Transfer } from "../types/api";
import { formatCurrency, formatDate, todayIso } from "../utils/format";

interface TransferFormState {
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

export function TransfersScreen() {
  const { isDark } = useAppTheme();
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
    if (accounts.length === 0) {
      return;
    }

    setForm((current) => {
      const nextFrom = current.from_account ?? accounts[0].id;
      const nextToCandidate = accounts.find((account) => account.id !== nextFrom);
      const nextTo = current.to_account ?? nextToCandidate?.id ?? null;

      if (
        nextFrom === current.from_account &&
        nextTo === current.to_account
      ) {
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
        (left, right) =>
          new Date(right.date).getTime() - new Date(left.date).getTime(),
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

  if (loading) {
    return <LoadingState />;
  }

  return (
    <AppScreen
      title="Transferencias"
      subtitle="Mueve dinero entre tus cuentas y genera ambos movimientos asociados en tu base local."
      refreshing={refreshing}
      onRefresh={handleRefresh}
      headerAction={
        <Pressable
          onPress={() => setModalVisible(true)}
          className={`h-11 w-11 items-center justify-center rounded-xl border ${isDark ? "border-red-500/35 bg-red-500/10" : "border-slate-300 bg-white"}`}
        >
          <Ionicons
            name="add"
            size={20}
            color={isDark ? "#fca5a5" : "#1e293b"}
          />
        </Pressable>
      }
    >
      {error ? <FeedbackBanner variant="error" message={error} /> : null}

      {accounts.length < 2 ? (
        <EmptyState
          title="Faltan cuentas"
          description="Necesitas al menos dos cuentas para poder hacer transferencias."
        />
      ) : sortedTransfers.length === 0 ? (
        <EmptyState
          title="No hay transferencias registradas"
          description="Haz una transferencia entre cuentas para verla reflejada aquí."
        />
      ) : (
        <View className="gap-3">
          {sortedTransfers.map((transfer) => (
            <View
              key={transfer.id}
              className={`rounded-2xl border p-5 ${isDark ? "border-red-500/15 bg-zinc-950/80" : "border-slate-300 bg-white"}`}
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {transfer.from_account_name} {"->"} {transfer.to_account_name}
                  </Text>
                  <Text
                    className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {formatDate(transfer.date)}
                  </Text>
                </View>
                <Text className="text-lg font-black text-amber-500">
                  {formatCurrency(transfer.amount)}
                </Text>
              </View>
              {transfer.description ? (
                <Text
                  className={`mt-3 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                >
                  {transfer.description}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <ModalSheet
        visible={modalVisible}
        title="Nueva transferencia"
        subtitle="Se creará automáticamente el gasto e ingreso espejo para mantener balances consistentes."
        onClose={() => {
          if (saving) {
            return;
          }

          setModalVisible(false);
        }}
      >
        <FormField label="Cuenta origen">
          <OptionSelector
            value={form.from_account ?? accounts[0]?.id ?? 0}
            options={accounts.map((account) => ({
              value: account.id,
              label: account.name,
            }))}
            onChange={(value) =>
              setForm((current) => ({ ...current, from_account: value }))
            }
          />
        </FormField>
        <FormField label="Cuenta destino">
          <OptionSelector
            value={form.to_account ?? accounts[1]?.id ?? accounts[0]?.id ?? 0}
            options={accounts.map((account) => ({
              value: account.id,
              label: account.name,
            }))}
            onChange={(value) =>
              setForm((current) => ({ ...current, to_account: value }))
            }
          />
        </FormField>
        <FormField label="Monto">
          <TextInput
            className={`rounded-xl border px-4 py-3 ${isDark ? "border-red-500/20 bg-red-500/5 text-red-50" : "border-slate-300 bg-white text-slate-900"}`}
            placeholder="90000"
            placeholderTextColor="#64748b"
            value={form.amount}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, amount: value }))
            }
            keyboardType="decimal-pad"
            editable={!saving}
          />
        </FormField>
        <FormField label="Fecha">
          <TextInput
            className={`rounded-xl border px-4 py-3 ${isDark ? "border-red-500/20 bg-red-500/5 text-red-50" : "border-slate-300 bg-white text-slate-900"}`}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748b"
            value={form.date}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, date: value }))
            }
            editable={!saving}
          />
        </FormField>
        <FormField label="Descripción">
          <TextInput
            className={`rounded-xl border px-4 py-3 ${isDark ? "border-red-500/20 bg-red-500/5 text-red-50" : "border-slate-300 bg-white text-slate-900"}`}
            placeholder="Motivo opcional"
            placeholderTextColor="#64748b"
            value={form.description}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, description: value }))
            }
            multiline
            editable={!saving}
          />
        </FormField>
        <ActionButton
          label="Guardar transferencia"
          onPress={handleCreate}
          loading={saving}
          disabled={accounts.length < 2}
        />
      </ModalSheet>
    </AppScreen>
  );
}
