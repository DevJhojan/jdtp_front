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
import { transactionTypeOptions } from "../constants/options";
import { useAppTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/client";
import {
  createTransaction,
  listAccounts,
  listCategories,
  listTransactions,
} from "../services/finance";
import type {
  Account,
  Category,
  Transaction,
  TransactionType,
} from "../types/api";
import { formatCurrency, formatDate, todayIso } from "../utils/format";

interface TransactionFormState {
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

export function TransactionsScreen() {
  const { isDark } = useAppTheme();
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
      const [nextTransactions, nextAccounts, nextCategories] =
        await Promise.all([
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

  useEffect(() => {
    if (accounts.length > 0 && form.account === null) {
      setForm((current) => ({ ...current, account: accounts[0].id }));
    }
  }, [accounts, form.account]);

  const filteredCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.category_type === form.transaction_type,
      ),
    [categories, form.transaction_type],
  );

  useEffect(() => {
    if (filteredCategories.length === 0) {
      if (form.category !== null) {
        setForm((current) => ({ ...current, category: null }));
      }
      return;
    }

    if (
      form.category === null ||
      !filteredCategories.some((category) => category.id === form.category)
    ) {
      setForm((current) => ({
        ...current,
        category: filteredCategories[0].id,
      }));
    }
  }, [filteredCategories, form.category]);

  const sortedTransactions = useMemo(
    () =>
      [...transactions].sort(
        (left, right) =>
          new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
    [transactions],
  );

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.transaction_type === "INCOME")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    [transactions],
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.transaction_type === "EXPENSE")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    [transactions],
  );

  const netTotal = totalIncome - totalExpense;

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
      setForm({
        ...defaultForm,
        account: accounts[0]?.id ?? null,
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
      title="Movimientos"
      subtitle="Registra ingresos y gastos contra tus cuentas y categorías disponibles."
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

      {accounts.length === 0 ? (
        <EmptyState
          title="No hay cuentas disponibles"
          description="Primero crea una cuenta para poder registrar movimientos."
        />
      ) : sortedTransactions.length === 0 ? (
        <>
          <View
            className={`mb-4 rounded-2xl border p-5 ${isDark ? "border-sky-500/20 bg-sky-500/5" : "border-sky-200 bg-sky-50"}`}
          >
            <Text
              className={`text-sm font-bold uppercase tracking-[2px] ${isDark ? "text-sky-200" : "text-sky-700"}`}
            >
              Neto total
            </Text>
            <Text
              className={`mt-3 text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {formatCurrency(netTotal)}
            </Text>
          </View>
          <View className="mb-4 flex-row gap-3">
            <View
              className={`flex-1 rounded-2xl border p-5 ${isDark ? "border-emerald-500/15 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50"}`}
            >
              <Text
                className={`text-sm font-bold uppercase tracking-[2px] ${isDark ? "text-emerald-200" : "text-emerald-700"}`}
              >
                Total ingresos
              </Text>
              <Text
                className={`mt-3 text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View
              className={`flex-1 rounded-2xl border p-5 ${isDark ? "border-rose-500/15 bg-rose-500/5" : "border-rose-200 bg-rose-50"}`}
            >
              <Text
                className={`text-sm font-bold uppercase tracking-[2px] ${isDark ? "text-rose-200" : "text-rose-700"}`}
              >
                Total gastos
              </Text>
              <Text
                className={`mt-3 text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {formatCurrency(totalExpense)}
              </Text>
            </View>
          </View>
          <EmptyState
            title="No hay movimientos registrados"
            description="Crea tu primer ingreso o gasto para empezar a mover el balance."
          />
        </>
      ) : (
        <>
          <View
            className={`mb-4 rounded-2xl border p-5 ${isDark ? "border-sky-500/20 bg-sky-500/5" : "border-sky-200 bg-sky-50"}`}
          >
            <Text
              className={`text-sm font-bold uppercase tracking-[2px] ${isDark ? "text-sky-200" : "text-sky-700"}`}
            >
              Neto total
            </Text>
            <Text
              className={`mt-3 text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {formatCurrency(netTotal)}
            </Text>
          </View>
          <View className="mb-4 flex-row gap-3">
            <View
              className={`flex-1 rounded-2xl border p-5 ${isDark ? "border-emerald-500/15 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50"}`}
            >
              <Text
                className={`text-sm font-bold uppercase tracking-[2px] ${isDark ? "text-emerald-200" : "text-emerald-700"}`}
              >
                Total ingresos
              </Text>
              <Text
                className={`mt-3 text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {formatCurrency(totalIncome)}
              </Text>
            </View>
            <View
              className={`flex-1 rounded-2xl border p-5 ${isDark ? "border-rose-500/15 bg-rose-500/5" : "border-rose-200 bg-rose-50"}`}
            >
              <Text
                className={`text-sm font-bold uppercase tracking-[2px] ${isDark ? "text-rose-200" : "text-rose-700"}`}
              >
                Total gastos
              </Text>
              <Text
                className={`mt-3 text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {formatCurrency(totalExpense)}
              </Text>
            </View>
          </View>
          <View className="gap-3">
            {sortedTransactions.map((transaction) => (
              <View
                key={transaction.id}
                className={`rounded-2xl border p-5 ${isDark ? "border-red-500/15 bg-zinc-950/80" : "border-slate-300 bg-white"}`}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text
                      className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {transaction.category_name}
                    </Text>
                    <Text
                      className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                    >
                      {transaction.account_name} ·{" "}
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                  <Text
                    className={`text-lg font-black ${transaction.transaction_type === "INCOME" ? "text-emerald-500" : "text-rose-500"}`}
                  >
                    {transaction.transaction_type === "INCOME" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
                {transaction.description ? (
                  <Text
                    className={`mt-3 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {transaction.description}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </>
      )}

      <ModalSheet
        visible={modalVisible}
        title="Nuevo movimiento"
        subtitle="Selecciona cuenta, categoría y tipo para registrar el movimiento."
        onClose={() => {
          if (saving) {
            return;
          }

          setModalVisible(false);
        }}
      >
        <FormField label="Tipo">
          <OptionSelector
            value={form.transaction_type}
            options={transactionTypeOptions}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                transaction_type: value,
              }))
            }
          />
        </FormField>
        <FormField label="Cuenta">
          <OptionSelector
            value={form.account ?? accounts[0]?.id ?? 0}
            options={accounts.map((account) => ({
              value: account.id,
              label: account.name,
            }))}
            onChange={(value) =>
              setForm((current) => ({ ...current, account: value }))
            }
          />
        </FormField>
        <FormField label="Categoría">
          {filteredCategories.length > 0 ? (
            <OptionSelector
              value={form.category ?? filteredCategories[0].id}
              options={filteredCategories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
              onChange={(value) =>
                setForm((current) => ({ ...current, category: value }))
              }
            />
          ) : (
            <EmptyState
              title="Sin categorías"
              description="No hay categorías disponibles para el tipo seleccionado."
            />
          )}
        </FormField>
        <FormField label="Monto">
          <TextInput
            className={`rounded-xl border px-4 py-3 ${isDark ? "border-red-500/20 bg-red-500/5 text-red-50" : "border-slate-300 bg-white text-slate-900"}`}
            placeholder="150000"
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
            placeholder="Detalle opcional"
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
          label="Guardar movimiento"
          onPress={handleCreate}
          loading={saving}
          disabled={filteredCategories.length === 0}
        />
      </ModalSheet>
    </AppScreen>
  );
}
