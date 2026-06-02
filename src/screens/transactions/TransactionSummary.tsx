import { Text, View } from "react-native";

import { useAppTheme } from "../../context/ThemeContext";
import { formatCurrency } from "../../utils/format";

interface Props {
  totalIncome: number;
  totalExpense: number;
  totalDebts: number;
  netTotal: number;
}

export function TransactionSummary({ totalIncome, totalExpense, totalDebts, netTotal }: Props) {
  const { isDark } = useAppTheme();

  return (
    <>
      {/* Neto total */}
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

      {/* Ingresos / Gastos */}
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
        <View
          className={`flex-1 rounded-2xl border p-5 ${isDark ? "border-rose-500/15 bg-rose-500/5" : "border-rose-200 bg-rose-50"}`}
        >
          <Text
            className={`text-sm font-bold uppercase tracking-[2px] ${isDark ? "text-rose-200" : "text-rose-700"}`}
          >
            Total deudas
          </Text>
          <Text
            className={`mt-3 text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
          >
            {formatCurrency(totalDebts)}
          </Text>
        </View>
      </View>
    </>
  );
}
