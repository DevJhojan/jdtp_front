import { TextInput } from "react-native";

import { ActionButton } from "../../components/ActionButton";
import { EmptyState } from "../../components/EmptyState";
import { FormField } from "../../components/FormField";
import { OptionSelector } from "../../components/OptionSelector";
import { transactionTypeOptions } from "../../constants/options";
import { useAppTheme } from "../../context/ThemeContext";
import type { Account, Category } from "../../types/api";
import type { TransactionFormState } from "./useTransactionsScreen";

interface Props {
  form: TransactionFormState;
  accounts: Account[];
  filteredCategories: Category[];
  saving: boolean;
  onUpdate: (patch: Partial<TransactionFormState>) => void;
  onSave: () => void;
}

export function TransactionForm({
  form,
  accounts,
  filteredCategories,
  saving,
  onUpdate,
  onSave,
}: Props) {
  const { isDark } = useAppTheme();

  const inputClass = `rounded-xl border px-4 py-3 ${
    isDark
      ? "border-red-500/20 bg-red-500/5 text-red-50"
      : "border-slate-300 bg-white text-slate-900"
  }`;

  return (
    <>
      <FormField label="Tipo">
        <OptionSelector
          value={form.transaction_type}
          options={transactionTypeOptions}
          onChange={(value) => onUpdate({ transaction_type: value })}
        />
      </FormField>

      <FormField label="Cuenta">
        <OptionSelector
          value={form.account ?? accounts[0]?.id ?? 0}
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          onChange={(value) => onUpdate({ account: value })}
        />
      </FormField>

      <FormField label="Categoría">
        {filteredCategories.length > 0 ? (
          <OptionSelector
            value={form.category ?? filteredCategories[0].id}
            options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(value) => onUpdate({ category: value })}
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
          onChangeText={(value) => onUpdate({ amount: value })}
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
          onChangeText={(value) => onUpdate({ date: value })}
          editable={!saving}
        />
      </FormField>

      <FormField label="Descripción">
        <TextInput
          className={inputClass}
          placeholder="Detalle opcional"
          placeholderTextColor="#64748b"
          value={form.description}
          onChangeText={(value) => onUpdate({ description: value })}
          multiline
          editable={!saving}
        />
      </FormField>

      <ActionButton
        label="Guardar movimiento"
        onPress={onSave}
        loading={saving}
        disabled={filteredCategories.length === 0}
      />
    </>
  );
}
