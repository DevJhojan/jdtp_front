import { useCallback, useEffect, useMemo, useState } from "react";
import { TextInput, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ActionButton } from "../components/ActionButton";
import { AppScreen } from "../components/AppScreen";
import { EmptyState } from "../components/EmptyState";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { FormField } from "../components/FormField";
import { LoadingState } from "../components/LoadingState";
import { OptionSelector } from "../components/OptionSelector";
import { transactionTypeOptions } from "../constants/options";
import { useAppTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/client";
import { createTransaction, listAccounts, listCategories } from "../services/finance";
import type { Account, Category, TransactionType } from "../types/api";
import type { RootStackParamList } from "../types/navigation";
import { todayIso } from "../utils/format";

interface TransactionFormState {
  account: number | null;
  category: number | null;
  amount: string;
  transaction_type: TransactionType;
  description: string;
  date: string;
}

const defaultForm: TransactionFormState = {
  account: null,
  category: null,
  amount: "",
  transaction_type: "EXPENSE",
  description: "",
  date: todayIso(),
};

export function TransactionFormScreen() {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionFormState>(defaultForm);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [nextAccounts, nextCategories] = await Promise.all([
          listAccounts(),
          listCategories(),
        ]);
        setAccounts(nextAccounts);
        setCategories(nextCategories);
        if (nextAccounts.length > 0) {
          setForm(prev => ({ ...prev, account: nextAccounts[0].id }));
        }
      } catch (e) {
        setError(getApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  const filteredCategories = useMemo(
    () => categories.filter((cat) => cat.category_type === form.transaction_type),
    [categories, form.transaction_type],
  );

  useEffect(() => {
    if (filteredCategories.length > 0) {
      if (form.category === null || !filteredCategories.some(c => c.id === form.category)) {
        setForm(prev => ({ ...prev, category: filteredCategories[0].id }));
      }
    } else {
      setForm(prev => ({ ...prev, category: null }));
    }
  }, [filteredCategories]);

  const handleSave = async () => {
    if (form.account === null || form.category === null) {
      setError("Debes seleccionar una cuenta y una categoría.");
      return;
    }

    if (!form.amount || isNaN(Number(form.amount))) {
      setError("Ingresa un monto válido.");
      return;
    }

    setSaving(true);
    try {
      await createTransaction({
        account: form.account,
        category: form.category,
        amount: form.amount,
        transaction_type: form.transaction_type,
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

  const updateForm = (patch: Partial<TransactionFormState>) =>
    setForm((current) => ({ ...current, ...patch }));

  if (loading) return <LoadingState />;

  const inputClass = `rounded-xl border px-4 py-3 ${
    isDark
      ? "border-red-500/20 bg-red-500/5 text-red-50"
      : "border-slate-300 bg-white text-slate-900"
  }`;

  return (
    <AppScreen
      title="Nuevo movimiento"
      subtitle="Selecciona cuenta, categoría y tipo para registrar el movimiento."
      canGoBack
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {error ? <FeedbackBanner variant="error" message={error} /> : null}

        <FormField label="Tipo">
          <OptionSelector
            value={form.transaction_type}
            options={transactionTypeOptions}
            onChange={(value) => updateForm({ transaction_type: value })}
          />
        </FormField>

        <FormField label="Cuenta">
          <OptionSelector
            value={form.account ?? 0}
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            onChange={(value) => updateForm({ account: value })}
          />
        </FormField>

        <FormField label="Categoría">
          {filteredCategories.length > 0 ? (
            <OptionSelector
              value={form.category ?? 0}
              options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
              onChange={(value) => updateForm({ category: value })}
            />
          ) : (
            <EmptyState
              title="Sin categorías"
              description="No hay categorías disponibles para el tipo seleccionado."
            />
          )}
        </FormField>

        <FormField label="Monto">
          <TextInput
            className={inputClass}
            placeholder="150000"
            placeholderTextColor="#64748b"
            value={form.amount}
            onChangeText={(value) => updateForm({ amount: value })}
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
            onChangeText={(value) => updateForm({ date: value })}
            editable={!saving}
          />
        </FormField>

        <FormField label="Descripción">
          <TextInput
            className={inputClass}
            placeholder="Detalle opcional"
            placeholderTextColor="#64748b"
            value={form.description}
            onChangeText={(value) => updateForm({ description: value })}
            multiline
            editable={!saving}
          />
        </FormField>

        <ActionButton
          label="Guardar movimiento"
          onPress={handleSave}
          loading={saving}
          disabled={filteredCategories.length === 0}
        />
      </ScrollView>
    </AppScreen>
  );
}
