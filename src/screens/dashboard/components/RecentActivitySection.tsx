import React from "react";
import { Text, View } from "react-native";
import { EmptyState } from "../../../components/EmptyState";
import { formatCurrency, formatDate } from "../../../utils/format";
import { useAppTheme } from "../../../context/ThemeContext";
import type { Transaction } from "../../../types/api";

interface RecentActivitySectionProps {
  recentTransactions: Transaction[];
}

export function RecentActivitySection({ recentTransactions }: RecentActivitySectionProps) {
  const { isDark } = useAppTheme();

  return (
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
                  className={`text-base font-black ${
                    transaction.transaction_type === "INCOME" || transaction.transaction_type === "DEBT"
                      ? "text-emerald-500"
                      : "text-rose-500"
                  }`}
                >
                  {transaction.transaction_type === "INCOME" || transaction.transaction_type === "DEBT" ? "+" : "-"}
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
  );
}
