import React from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppScreen } from "../components/AppScreen";
import { EmptyState } from "../components/EmptyState";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { LoadingState } from "../components/LoadingState";
import { useAppTheme } from "../context/ThemeContext";

import { useTransfers } from "./transfers/useTransfers";
import { TransferItem } from "./transfers/components/TransferItem";
import type { RootStackParamList } from "../types/navigation";

export function TransfersScreen() {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const {
    accounts,
    transfers,
    loading,
    refreshing,
    error,
    handleRefresh,
  } = useTransfers();

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
          onPress={() => navigation.navigate("NuevaTransferencia")}
          className={`h-11 w-11 items-center justify-center rounded-xl border ${
            isDark ? "border-red-500/35 bg-red-500/10" : "border-slate-300 bg-white"
          }`}
        >
          <Ionicons name="add" size={20} color={isDark ? "#fca5a5" : "#1e293b"} />
        </Pressable>
      }
    >
      {error ? <FeedbackBanner variant="error" message={error} /> : null}

      {accounts.length < 2 ? (
        <EmptyState
          title="Faltan cuentas"
          description="Necesitas al menos dos cuentas para poder hacer transferencias."
        />
      ) : transfers.length === 0 ? (
        <EmptyState
          title="No hay transferencias registradas"
          description="Haz una transferencia entre cuentas para verla reflejada aquí."
        />
      ) : (
        <View className="gap-3">
          {transfers.map((transfer) => (
            <TransferItem key={transfer.id} transfer={transfer} />
          ))}
        </View>
      )}
    </AppScreen>
  );
}
