import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppScreen } from "../components/AppScreen";
import { EmptyState } from "../components/EmptyState";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { LoadingState } from "../components/LoadingState";
import { MetricCard } from "../components/MetricCard";
import { ActionButton } from "../components/ActionButton";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/client";
import { listAccounts, listTransactions, listTransfers } from "../services/finance";
import type { RootStackParamList } from "../types/navigation";
import type { Account, Transaction, Transfer } from "../types/api";
import { formatCurrency, formatDate } from "../utils/format";

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

export function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { user } = useAuth();
  const { isDark } = useAppTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const totalBalance = useMemo(
    () =>
      accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0),
    [accounts],
  );

  const incomeTotal = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.transaction_type === "INCOME")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    [transactions],
  );

  const expenseTotal = useMemo(
    () =>
      transactions
        .filter((transaction) => transaction.transaction_type === "EXPENSE")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0),
    [transactions],
  );

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort(
          (left, right) =>
            new Date(right.date).getTime() - new Date(left.date).getTime(),
        )
        .slice(0, 5),
    [transactions],
  );

  if (loading) {
    return <LoadingState />;
  }

  return (
    <AppScreen
      title="Resumen"
      subtitle="Controla tu saldo total, revisa actividad reciente y mantén el pulso de tu finanzas locales."
      refreshing={refreshing}
      onRefresh={handleRefresh}
      headerAction={
        <Pressable
          onPress={() => navigation.navigate("Configuracion")}
          className={`h-11 w-11 items-center justify-center rounded-xl border ${isDark ? "border-red-500/35 bg-red-500/10" : "border-slate-300 bg-white"}`}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={isDark ? "#fca5a5" : "#1e293b"}
          />
        </Pressable>
      }
    >
      {error ? <FeedbackBanner variant="error" message={error} /> : null}

      <View
        className={`mb-4 rounded-3xl border px-6 py-5 ${isDark ? "border-red-500/20 bg-[#180206]" : "border-red-200 bg-white"}`}
      >
        <Text
          className={`text-sm font-bold uppercase tracking-[3px] ${isDark ? "text-red-200/70" : "text-red-700"}`}
        >
          Sesión activa
        </Text>
        <Text
          className={`mt-3 text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {user?.first_name?.trim()
            ? `${user.first_name} ${user.last_name}`.trim()
            : user?.email}
        </Text>
        <Text
          className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}
        >
          {user?.email}
        </Text>
      </View>

      <View className="mb-4 flex-row gap-3">
        <MetricCard
          label="Saldo total"
          value={formatCurrency(totalBalance)}
          helper={`${accounts.length} cuentas activas`}
        />
      </View>
      <View className="mb-4 flex-row gap-3">
        <MetricCard
          label="Ingresos"
          value={formatCurrency(incomeTotal)}
          helper={`${transactions.filter((item) => item.transaction_type === "INCOME").length} movimientos`}
        />
        <MetricCard
          label="Gastos"
          value={formatCurrency(expenseTotal)}
          helper={`${transactions.filter((item) => item.transaction_type === "EXPENSE").length} movimientos`}
        />
      </View>
      <View className="mb-4 flex-row gap-3">
        <MetricCard
          label="Transferencias"
          value={String(transfers.length)}
          helper="Entre tus propias cuentas"
        />
      </View>

      {accounts.length === 0 ? (
        <EmptyState
          title="Aún no tienes cuentas"
          description="Crea tu primera cuenta desde la pestaña Cuentas para empezar a registrar movimientos."
        />
      ) : (
        <>
          <View
            className={`mb-4 rounded-2xl border p-5 ${isDark ? "border-red-500/15 bg-zinc-950/80" : "border-slate-300 bg-white"}`}
          >
            <Text
              className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Cuentas
            </Text>
            <View className="mt-4 gap-3">
              {accounts.map((account) => (
                <View
                  key={account.id}
                  className={`rounded-2xl border p-4 ${isDark ? "border-red-500/10 bg-red-500/5" : "border-red-100 bg-red-50/60"}`}
                >
                  <Text
                    className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {account.name}
                  </Text>
                  <Text
                    className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {account.account_type}
                  </Text>
                  <Text
                    className={`mt-3 text-xl font-black ${isDark ? "text-red-100" : "text-red-700"}`}
                  >
                    {formatCurrency(account.balance)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View
            className={`rounded-2xl border p-5 ${isDark ? "border-red-500/15 bg-zinc-950/80" : "border-slate-300 bg-white"}`}
          >
            <Text
              className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Actividad reciente
            </Text>
            {recentTransactions.length === 0 ? (
              <View className="mt-4">
                <EmptyState
                  title="Sin movimientos todavía"
                  description="Registra ingresos o gastos desde la pestaña Movimientos."
                />
              </View>
            ) : (
              <View className="mt-4 gap-3">
                {recentTransactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    className={`rounded-2xl border p-4 ${isDark ? "border-red-500/10 bg-red-500/5" : "border-red-100 bg-red-50/60"}`}
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-1">
                        <Text
                          className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          {transaction.category_name}
                        </Text>
                        <Text
                          className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {transaction.account_name} · {formatDate(transaction.date)}
                        </Text>
                      </View>
                      <Text
                        className={`text-base font-black ${transaction.transaction_type === "INCOME" ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {transaction.transaction_type === "INCOME" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </Text>
                    </View>
                    {transaction.description ? (
                      <Text
                        className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                      >
                        {transaction.description}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </AppScreen>
  );
}
