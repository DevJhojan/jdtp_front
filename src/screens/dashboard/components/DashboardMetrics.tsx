import React from "react";
import { View } from "react-native";
import { MetricCard } from "../../../components/MetricCard";
import { formatCurrency } from "../../../utils/format";
import type { Transaction, Transfer } from "../../../types/api";

interface DashboardMetricsProps {
  metrics: {
    incomeTotal: number;
    expenseTotal: number;
    debtTotal: number;
    netTotal: number;
  };
  transactions: Transaction[];
  transfers: Transfer[];
}

export function DashboardMetrics({ metrics, transactions, transfers }: DashboardMetricsProps) {
  const { incomeTotal, expenseTotal, debtTotal, netTotal } = metrics;

  return (
    <>
      <View className="mb-4 flex-row gap-3">
        <MetricCard
          label="Neto total"
          value={formatCurrency(netTotal)}
          helper="Saldo disponible menos deudas"
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
          label="Deudas"
          value={formatCurrency(debtTotal)}
          helper={`${transactions.filter((item) => item.transaction_type === "DEBT" || item.transaction_type === "DEBT_PAYMENT").length} movimientos`}
        />
        <MetricCard
          label="Transferencias"
          value={String(transfers.length)}
          helper="Entre tus propias cuentas"
        />
      </View>
    </>
  );
}
