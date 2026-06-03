import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppScreen } from "../components/AppScreen";
import { EmptyState } from "../components/EmptyState";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { LoadingState } from "../components/LoadingState";
import { accountTypeOptions } from "../constants/options";
import { useAppTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/client";
import { listAccounts } from "../services/finance";
import type { Account } from "../types/api";
import type { RootStackParamList } from "../types/navigation";
import { formatCurrency } from "../utils/format";

export function AccountsScreen() {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setError(null);
      const response = await listAccounts();
      setAccounts(response);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAccounts();
    }, [loadAccounts]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
  };

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((left, right) =>
        left.name.localeCompare(right.name, "es"),
      ),
    [accounts],
  );

  if (loading) {
    return <LoadingState />;
  }

  return (
    <AppScreen
      title="Cuentas"
      subtitle="Administra las cuentas base donde vive tu saldo: efectivo, bancos y tarjetas."
      refreshing={refreshing}
      onRefresh={handleRefresh}
      headerAction={
        <Pressable
          onPress={() => navigation.navigate("NuevaCuenta")}
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

      {sortedAccounts.length === 0 ? (
        <EmptyState
          title="No hay cuentas creadas"
          description="Añade una cuenta para empezar a registrar ingresos, gastos y transferencias."
        />
      ) : (
        <View className="gap-3">
          {sortedAccounts.map((account) => (
            <View
              key={account.id}
              className={`rounded-2xl border p-5 ${isDark ? "border-red-500/15 bg-zinc-950/80" : "border-slate-300 bg-white"}`}
            >
              <Text
                className={`text-lg font-black ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {account.name}
              </Text>
              <Text
                className={`mt-1 text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                {
                  accountTypeOptions.find((item) => item.value === account.account_type)
                    ?.label
                }
              </Text>
              <Text
                className={`mt-4 text-3xl font-black ${isDark ? "text-red-100" : "text-red-700"}`}
              >
                {formatCurrency(account.balance)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </AppScreen>
  );
}
