import { useEffect, useState } from "react";
import { TextInput, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ActionButton } from "../components/ActionButton";
import { AppScreen } from "../components/AppScreen";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { FormField } from "../components/FormField";
import { LoadingState } from "../components/LoadingState";
import { OptionSelector } from "../components/OptionSelector";
import { useAppTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/client";
import { createTransfer, listAccounts } from "../services/finance";
import type { Account } from "../types/api";
import type { RootStackParamList } from "../types/navigation";
import { todayIso } from "../utils/format";

interface TransferFormState {
  from_account: number | null;
  to_account: number | null;
  amount: string;
  description: string;
  date: string;
}

const defaultForm: TransferFormState = {
  from_account: null,
  to_account: null,
  amount: "",
  description: "",
  date: todayIso(),
};

export function TransferFormScreen() {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TransferFormState>(defaultForm);

  useEffect(() => {
    const loadData = async () => {
      try {
        const nextAccounts = await listAccounts();
        setAccounts(nextAccounts);
        if (nextAccounts.length >= 2) {
          setForm(prev => ({
            ...prev,
            from_account: nextAccounts[0].id,
            to_account: nextAccounts[1].id
          }));
        }
      } catch (e) {
        setError(getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const handleSave = async () => {
    if (form.from_account === null || form.to_account === null) {
      setError("Debes seleccionar ambas cuentas.");
      return;
    }

    if (form.from_account === form.to_account) {
      setError("La cuenta origen y destino deben ser diferentes.");
      return;
    }

    if (!form.amount || isNaN(Number(form.amount))) {
      setError("Ingresa un monto válido.");
      return;
    }

    setSaving(true);
    try {
      await createTransfer({
        from_account: form.from_account,
        to_account: form.to_account,
        amount: form.amount,
        description: form.description.trim() || undefined,
        date: form.date,
      });
      navigation.goBack();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState />;

  const inputClass = `rounded-xl border px-4 py-3 ${
    isDark
      ? "border-red-500/20 bg-red-500/5 text-red-50"
      : "border-slate-300 bg-white text-slate-900"
  }`;

  return (
    <AppScreen
      title="Nueva transferencia"
      subtitle="Se creará automáticamente el gasto e ingreso espejo para mantener balances consistentes."
      canGoBack
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {error ? <FeedbackBanner variant="error" message={error} /> : null}

        <FormField label="Cuenta origen">
          <OptionSelector
            value={form.from_account ?? 0}
            options={accounts.map((account) => ({
              value: account.id,
              label: account.name,
            }))}
            onChange={(value) =>
              setForm((current) => ({ ...current, from_account: value }))
            }
          />
        </FormField>

        <FormField label="Cuenta destino">
          <OptionSelector
            value={form.to_account ?? 0}
            options={accounts.map((account) => ({
              value: account.id,
              label: account.name,
            }))}
            onChange={(value) =>
              setForm((current) => ({ ...current, to_account: value }))
            }
          />
        </FormField>

        <FormField label="Monto">
          <TextInput
            className={inputClass}
            placeholder="90000"
            placeholderTextColor="#64748b"
            value={form.amount}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, amount: value }))
            }
            keyboardType="decimal-pad"
            editable={!saving}
          />
        </FormField>

        <FormField label="Fecha">
          <TextInput
            className={inputClass}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748b"
            value={form.date}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, date: value }))
            }
            editable={!saving}
          />
        </FormField>

        <FormField label="Descripción">
          <TextInput
            className={inputClass}
            placeholder="Motivo opcional"
            placeholderTextColor="#64748b"
            value={form.description}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, description: value }))
            }
            multiline
            editable={!saving}
          />
        </FormField>

        <ActionButton
          label="Guardar transferencia"
          onPress={handleSave}
          loading={saving}
          disabled={accounts.length < 2}
        />
      </ScrollView>
    </AppScreen>
  );
}
