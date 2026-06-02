import React from "react";
import { TextInput } from "react-native";
import { ActionButton } from "../../../components/ActionButton";
import { FormField } from "../../../components/FormField";
import { ModalSheet } from "../../../components/ModalSheet";
import { OptionSelector } from "../../../components/OptionSelector";
import { useAppTheme } from "../../../context/ThemeContext";
import type { Account } from "../../../types/api";
import type { TransferFormState } from "../useTransfers";

interface TransferFormModalProps {
  visible: boolean;
  saving: boolean;
  accounts: Account[];
  form: TransferFormState;
  onClose: () => void;
  onFormChange: (updater: (current: TransferFormState) => TransferFormState) => void;
  onSubmit: () => void;
}

export function TransferFormModal({
  visible,
  saving,
  accounts,
  form,
  onClose,
  onFormChange,
  onSubmit,
}: TransferFormModalProps) {
  const { isDark } = useAppTheme();

  return (
    <ModalSheet
      visible={visible}
      title="Nueva transferencia"
      subtitle="Se creará automáticamente el gasto e ingreso espejo para mantener balances consistentes."
      onClose={onClose}
    >
      <FormField label="Cuenta origen">
        <OptionSelector
          value={form.from_account ?? accounts[0]?.id ?? 0}
          options={accounts.map((account) => ({
            value: account.id,
            label: account.name,
          }))}
          onChange={(value) =>
            onFormChange((current) => ({ ...current, from_account: value }))
          }
        />
      </FormField>
      <FormField label="Cuenta destino">
        <OptionSelector
          value={form.to_account ?? accounts[1]?.id ?? accounts[0]?.id ?? 0}
          options={accounts.map((account) => ({
            value: account.id,
            label: account.name,
          }))}
          onChange={(value) =>
            onFormChange((current) => ({ ...current, to_account: value }))
          }
        />
      </FormField>
      <FormField label="Monto">
        <TextInput
          className={`rounded-xl border px-4 py-3 ${
            isDark ? "border-red-500/20 bg-red-500/5 text-red-50" : "border-slate-300 bg-white text-slate-900"
          }`}
          placeholder="90000"
          placeholderTextColor="#64748b"
          value={form.amount}
          onChangeText={(value) =>
            onFormChange((current) => ({ ...current, amount: value }))
          }
          keyboardType="decimal-pad"
          editable={!saving}
        />
      </FormField>
      <FormField label="Fecha">
        <TextInput
          className={`rounded-xl border px-4 py-3 ${
            isDark ? "border-red-500/20 bg-red-500/5 text-red-50" : "border-slate-300 bg-white text-slate-900"
          }`}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#64748b"
          value={form.date}
          onChangeText={(value) =>
            onFormChange((current) => ({ ...current, date: value }))
          }
          editable={!saving}
        />
      </FormField>
      <FormField label="Descripción">
        <TextInput
          className={`rounded-xl border px-4 py-3 ${
            isDark ? "border-red-500/20 bg-red-500/5 text-red-50" : "border-slate-300 bg-white text-slate-900"
          }`}
          placeholder="Motivo opcional"
          placeholderTextColor="#64748b"
          value={form.description}
          onChangeText={(value) =>
            onFormChange((current) => ({ ...current, description: value }))
          }
          multiline
          editable={!saving}
        />
      </FormField>
      <ActionButton
        label="Guardar transferencia"
        onPress={onSubmit}
        loading={saving}
        disabled={accounts.length < 2}
      />
    </ModalSheet>
  );
}
