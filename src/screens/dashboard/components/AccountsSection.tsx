import React from "react";
import { Text, View } from "react-native";
import { EmptyState } from "../../../components/EmptyState";
import { formatCurrency } from "../../../utils/format";
import { useAppTheme } from "../../../context/ThemeContext";
import type { Account } from "../../../types/api";

interface AccountsSectionProps {
  accounts: Account[];
}

export function AccountsSection({ accounts }: AccountsSectionProps) {
  const { isDark } = useAppTheme();

  if (accounts.length === 0) {
    return (
      <EmptyState
        title="Aún no tienes cuentas"
        description="Crea tu primera cuenta desde la pestaña Cuentas para empezar a registrar movimientos."
      />
    );
  }

  return (
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
  );
}
