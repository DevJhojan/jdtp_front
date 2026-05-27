import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { ActionButton } from "../components/ActionButton";
import { AppScreen } from "../components/AppScreen";
import { EmptyState } from "../components/EmptyState";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { FormField } from "../components/FormField";
import { LoadingState } from "../components/LoadingState";
import { ModalSheet } from "../components/ModalSheet";
import { OptionSelector } from "../components/OptionSelector";
import { accountTypeOptions } from "../constants/options";
import { useAppTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/client";
import { createAccount, listAccounts } from "../services/finance";
import type { Account, AccountType } from "../types/api";
import { formatCurrency } from "../utils/format";

interface AccountFormState {
  name: string;
  account_type: AccountType;
}

const defaultForm: AccountFormState = {
  name: "",
  account_type: "CASH",
};

export function AccountsScreen() {
  const { isDark } = useAppTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AccountFormState>(defaultForm);

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

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createAccount({
        name: form.name.trim(),
        account_type: form.account_type,
      });
      setForm(defaultForm);
      setModalVisible(false);
      await loadAccounts();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
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
          onPress={() => setModalVisible(true)}
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

      <ModalSheet
        visible={modalVisible}
        title="Nueva cuenta"
        subtitle="La cuenta se guardará asociada a tu usuario autenticado."
        onClose={() => {
          if (saving) {
            return;
          }

          setModalVisible(false);
          setForm(defaultForm);
        }}
      >
        <FormField label="Nombre">
          <TextInput
            className={`rounded-xl border px-4 py-3 ${isDark ? "border-red-500/20 bg-red-500/5 text-red-50" : "border-slate-300 bg-white text-slate-900"}`}
            placeholder="Ej: Cuenta principal"
            placeholderTextColor="#64748b"
            value={form.name}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, name: value }))
            }
            editable={!saving}
          />
        </FormField>
        <FormField label="Tipo de cuenta">
          <OptionSelector
            value={form.account_type}
            options={accountTypeOptions}
            onChange={(value) =>
              setForm((current) => ({ ...current, account_type: value }))
            }
          />
        </FormField>
        <ActionButton
          label="Guardar cuenta"
          onPress={handleCreate}
          loading={saving}
        />
      </ModalSheet>
    </AppScreen>
  );
}
