import { useCallback, useEffect, useMemo, useState } from "react";
import { TextInput, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ActionButton } from "../../components/ActionButton";
import { AppScreen } from "../../components/AppScreen";
import { EmptyState } from "../../components/EmptyState";
import { FeedbackBanner } from "../../components/FeedbackBanner";
import { FormField } from "../../components/FormField";
import { LoadingState } from "../../components/LoadingState";
import { OptionSelector } from "../../components/OptionSelector";
import { transactionTypeOptions } from "../../constants/options";
import { useAppTheme } from "../../context/ThemeContext";
import { getApiErrorMessage } from "../../services/client";
import { createLocalTransaction, listLocalTransactions, updateLocalTransaction } from "../../repositories/finance/transactionRepository";
import { listAccounts, listCategories } from "../../services/finance";
import { getCurrentUser } from "../../services/auth";
import type { Account, Category, TransactionType } from "../../types/api";
import type { RootStackParamList } from "../../types/navigation";
import { todayIso } from "../../utils/format";

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
  const route = useRoute<RouteProp<RootStackParamList, "NuevoMovimiento">>();
  const transactionId = route.params?.transactionId;
  
  const [userId, setUserId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionFormState>(defaultForm);

  useEffect(() => {
    const init = async () => {
        try {
            const user = await getCurrentUser();
            setUserId(user.id);
            const [nextAccounts, nextCategories] = await Promise.all([
                listAccounts(),
                listCategories(),
            ]);
            setAccounts(nextAccounts);
            setCategories(nextCategories);
            
            if (transactionId) {
                const transactions = await listLocalTransactions(user.id);
                const transaction = transactions.find(t => t.id === transactionId);
                if (transaction) {
                    setForm({
                        account: transaction.account_id,
                        category: transaction.category_id,
                        amount: transaction.amount.toString(),
                        transaction_type: transaction.transaction_type,
                        description: transaction.description || "",
                        date: transaction.date,
                    });
                } else {
                    setError("Movimiento no encontrado.");
                }
            } else if (nextAccounts.length > 0) {
                setForm(prev => ({ ...prev, account: nextAccounts[0].id }));
            }
        } catch (e) {
            setError(getApiErrorMessage(e));
        } finally {
            setLoading(false);
        }
    }
    void init();
  }, [transactionId]);

  const filteredCategories = useMemo(
    () => categories.filter((cat) => cat.category_type === form.transaction_type),
    [categories, form.transaction_type],
  );

  const handleSave = async () => {
    if (form.account === null || form.category === null || !userId) {
      setError("Debes seleccionar una cuenta y una categoría.");
      return;
    }

    if (!form.amount || isNaN(Number(form.amount))) {
      setError("Ingresa un monto válido.");
      return;
    }

    setSaving(true);
    try {
      if (transactionId) {
          await updateLocalTransaction(userId, transactionId, {
            account: form.account,
            category: form.category,
            amount: form.amount,
            transaction_type: form.transaction_type,
            description: form.description.trim() || undefined,
            date: form.date,
          });
      } else {
          await createLocalTransaction(userId, {
            account: form.account,
            category: form.category,
            amount: form.amount,
            transaction_type: form.transaction_type,
            description: form.description.trim() || undefined,
            date: form.date,
          });
      }
      navigation.goBack();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    if (form.transaction_type === "DEBT" || form.transaction_type === "DEBT_PAYMENT") {
      return accounts.filter(a => a.account_type === "CREDIT");
    }
    return accounts.filter(a => ["CASH", "BANK", "CARD"].includes(a.account_type));
  }, [accounts, form.transaction_type]);

  useEffect(() => {
    // Si la cuenta seleccionada actualmente no está en el nuevo filtro, resetearla
    if (form.account !== null && !filteredAccounts.find(a => a.id === form.account)) {
      updateForm({ account: filteredAccounts.length > 0 ? filteredAccounts[0].id : null });
    }
  }, [filteredAccounts, form.account]);

  const updateForm = (patch: Partial<TransactionFormState>) => {
    setForm((current) => {
        const nextForm = { ...current, ...patch };
        return nextForm;
    });
  };

  if (loading) return <LoadingState />;

  const inputClass = `rounded-xl border px-4 py-3 ${
    isDark
      ? "border-red-500/20 bg-red-500/5 text-red-50"
      : "border-slate-300 bg-white text-slate-900"
  }`;

  return (
    <AppScreen
      title={transactionId ? "Editar movimiento" : "Nuevo movimiento"}
      subtitle="Selecciona cuenta, categoría y tipo para registrar el movimiento."
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
            options={filteredAccounts.map((a) => ({ value: a.id, label: a.name }))}
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
          label={transactionId ? "Actualizar movimiento" : "Guardar movimiento"}
          onPress={handleSave}
          loading={saving}
          disabled={filteredCategories.length === 0}
        />
      </ScrollView>
    </AppScreen>
  );
}
