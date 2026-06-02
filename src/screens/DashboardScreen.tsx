import React from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppScreen } from "../components/AppScreen";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { LoadingState } from "../components/LoadingState";
import { useAppTheme } from "../context/ThemeContext";
import type { RootStackParamList } from "../types/navigation";

import { useDashboard } from "./dashboard/useDashboard";
import { DashboardHeader } from "./dashboard/components/DashboardHeader";
import { DashboardMetrics } from "./dashboard/components/DashboardMetrics";
import { AccountsSection } from "./dashboard/components/AccountsSection";
import { RecentActivitySection } from "./dashboard/components/RecentActivitySection";

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, "Tabs">;

export function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { isDark } = useAppTheme();
  
  const {
    accounts,
    transactions,
    transfers,
    loading,
    refreshing,
    error,
    metrics,
    recentTransactions,
    handleRefresh,
  } = useDashboard();

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
          className={`h-11 w-11 items-center justify-center rounded-xl border ${
            isDark ? "border-red-500/35 bg-red-500/10" : "border-slate-300 bg-white"
          }`}
        >
          <Ionicons name="settings-outline" size={20} color={isDark ? "#fca5a5" : "#1e293b"} />
        </Pressable>
      }
    >
      {error ? <FeedbackBanner variant="error" message={error} /> : null}

      <DashboardHeader />

      <DashboardMetrics 
        metrics={metrics} 
        transactions={transactions} 
        transfers={transfers} 
      />

      <AccountsSection accounts={accounts} />

      <RecentActivitySection recentTransactions={recentTransactions} />
    </AppScreen>
  );
}
