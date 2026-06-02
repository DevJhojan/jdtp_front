import React from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "../../../context/ThemeContext";
import { formatCurrency, formatDate } from "../../../utils/format";
import type { Transfer } from "../../../types/api";

interface TransferItemProps {
  transfer: Transfer;
}

export function TransferItem({ transfer }: TransferItemProps) {
  const { isDark } = useAppTheme();

  return (
    <View
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
  );
}
