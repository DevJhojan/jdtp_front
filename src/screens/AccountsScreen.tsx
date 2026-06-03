import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppScreen } from "../components/AppScreen";
import { EmptyState } from "../components/EmptyState";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { LoadingState } from "../components/LoadingState";
import { OptionSelector } from "../components/OptionSelector";
import { accountTypeOptions } from "../constants/options";
import { useAppTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/client";
import { listAccounts } from "../services/finance";
import { deleteLocalAccount } from "../repositories/finance/accountRepository";
import { getCurrentUser } from "../services/auth";
import type { Account, AccountType } from "../types/api";
import type { RootStackParamList } from "../types/navigation";
import { formatCurrency } from "../utils/format";

type FilterType = AccountType | 'ALL';

export function AccountsScreen() {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('ALL');

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

  const handleDelete = async (accountId: number) => {
    Alert.alert("Eliminar cuenta", "¿Estás seguro? Esta acción no se puede deshacer.", [
      { text: "Cancelar" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
            try {
                const user = await getCurrentUser();
                await deleteLocalAccount(user.id, accountId);
                await loadAccounts();
            } catch (e) {
                setError(getApiErrorMessage(e));
            }
        }
      }
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
  };

  const filteredAccounts = useMemo(
    () => {
        let filtered = [...accounts];
        if (filter !== 'ALL') {
            filtered = filtered.filter(a => a.account_type === filter);
        }
        return filtered.sort((left, right) =>
            left.name.localeCompare(right.name, "es"),
        );
    },
    [accounts, filter],
  );

  if (loading) {
    return <LoadingState />;
  }

  const filterOptions = [
    { value: 'ALL', label: 'Todas' },
    ...accountTypeOptions
  ];

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

      <View className="mb-6">
          <OptionSelector
            value={filter}
            options={filterOptions}
            onChange={(value) => setFilter(value as FilterType)}
          />
      </View>

      {filteredAccounts.length === 0 ? (
        <EmptyState
          title="No hay cuentas"
          description="No se encontraron cuentas con el filtro seleccionado."
        />
      ) : (
        <View className="gap-3">
          {filteredAccounts.map((account) => (
            <View
              key={account.id}
              className={`rounded-2xl border p-5 ${isDark ? "border-red-500/15 bg-zinc-950/80" : "border-slate-300 bg-white"}`}
            >
              <View className="flex-row items-center justify-between">
                <View>
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
                </View>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => navigation.navigate("NuevaCuenta", { accountId: account.id })}
                    className={`p-2 rounded-lg ${isDark ? "bg-zinc-800" : "bg-slate-100"}`}
                  >
                    <Ionicons name="pencil" size={16} color={isDark ? "#fca5a5" : "#1e293b"} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(account.id)}
                    className={`p-2 rounded-lg ${isDark ? "bg-red-900/30" : "bg-red-50"}`}
                  >
                    <Ionicons name="trash" size={16} color={isDark ? "#fca5a5" : "#dc2626"} />
                  </Pressable>
                </View>
              </View>
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
