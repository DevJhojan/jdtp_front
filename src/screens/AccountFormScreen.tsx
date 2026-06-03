import { useState } from "react";
import { TextInput, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ActionButton } from "../components/ActionButton";
import { AppScreen } from "../components/AppScreen";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { FormField } from "../components/FormField";
import { OptionSelector } from "../components/OptionSelector";
import { accountTypeOptions } from "../constants/options";
import { useAppTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/client";
import { createAccount } from "../services/finance";
import type { AccountType } from "../types/api";
import type { RootStackParamList } from "../types/navigation";

interface AccountFormState {
  name: string;
  account_type: AccountType;
}

const defaultForm: AccountFormState = {
  name: "",
  account_type: "CASH",
};

export function AccountFormScreen() {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AccountFormState>(defaultForm);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError("El nombre de la cuenta es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await createAccount({
        name: form.name.trim(),
        account_type: form.account_type,
      });
      navigation.goBack();
    } catch (saveError) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      title="Nueva cuenta"
      subtitle="La cuenta se guardará asociada a tu usuario autenticado."
      canGoBack
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {error ? <FeedbackBanner variant="error" message={error} /> : null}

        <FormField label="Nombre">
          <TextInput
            className={`rounded-xl border px-4 py-3 ${
              isDark
                ? "border-red-500/20 bg-red-500/5 text-red-50"
                : "border-slate-300 bg-white text-slate-900"
            }`}
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
      </ScrollView>
    </AppScreen>
  );
}
