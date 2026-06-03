import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppScreen } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { FeedbackBanner } from "../../components/FeedbackBanner";
import { LoadingState } from "../../components/LoadingState";
import { useAppTheme } from "../../context/ThemeContext";
import { formatCurrency, formatDate } from "../../utils/format";
import { TransactionSummary } from "./TransactionSummary";
import { useTransactionsScreen } from "./useTransactionsScreen";
import type { RootStackParamList } from "../../types/navigation";

export function TransactionsScreen() {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    accounts,
    sortedTransactions,
    totalIncome,
    totalExpense,
    totalDebtPending,
    netTotal,
    loading,
    refreshing,
    error,
    handleRefresh,
  } = useTransactionsScreen();

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
          onPress={() => navigation.navigate("NuevoMovimiento")}
          className={`h-11 w-11 items-center justify-center rounded-xl border ${isDark ? "border-red-500/35 bg-red-500/10" : "border-slate-300 bg-white"}`}
        >
          <Ionicons name="add" size={20} color={isDark ? "#fca5a5" : "#1e293b"} />
        </Pressable>
      }
    >
      {error ? <FeedbackBanner variant="error" message={error} /> : null}

      {accounts.length === 0 ? (
        <EmptyState
          title="No hay cuentas disponibles"
          description="Primero crea una cuenta para poder registrar movimientos."
        />
      ) : (
        <>
          <TransactionSummary
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            totalDebtPending={totalDebtPending}
            netTotal={netTotal}
          />

          {sortedTransactions.length === 0 ? (
            <EmptyState
              title="No hay movimientos registrados"
              description="Crea tu primer ingreso o gasto para empezar a mover el balance."
            />
          ) : (
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
                        {transaction.account_name} · {formatDate(transaction.date)}
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
          )}
        </>
      )}
    </AppScreen>
  );
}
