import React from "react";
import { Text, TextInput, View } from "react-native";
import { ActionButton } from "../../../components/ActionButton";
import { FormField } from "../../../components/FormField";
import { useAppTheme } from "../../../context/ThemeContext";

const inputBaseClass = "rounded-xl border px-4 py-3 placeholder:text-slate-400";

interface AuthFormProps {
  mode: "login" | "signup";
  signing: boolean;
  form: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  };
  onFormChange: (field: string, value: string) => void;
  onSubmit: () => void;
  onGoogleLogin?: () => void;
}

export function AuthForm({
  mode,
  signing,
  form,
  onFormChange,
  onSubmit,
  onGoogleLogin,
}: AuthFormProps) {
  const { isDark } = useAppTheme();
  const inputThemeClass = isDark
    ? "border-red-500/20 bg-zinc-950 text-white focus:border-red-500"
    : "border-slate-300 bg-white text-slate-900 focus:border-red-600";

  return (
    <View
      className={`rounded-2xl border p-5 ${
        isDark ? "border-red-500/20 bg-zinc-950/85" : "border-slate-300 bg-white/90"
      }`}
    >
      <FormField label="Correo">
        <TextInput
          className={`${inputBaseClass} ${inputThemeClass}`}
          placeholder="correo@dominio.com"
          placeholderTextColor="#64748b"
          value={form.email}
          onChangeText={(v) => onFormChange("email", v)}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!signing}
        />
      </FormField>

      <FormField label="Contraseña">
        <TextInput
          className={`${inputBaseClass} ${inputThemeClass}`}
          placeholder="Tu contraseña"
          placeholderTextColor="#64748b"
          value={form.password}
          onChangeText={(v) => onFormChange("password", v)}
          secureTextEntry
          editable={!signing}
        />
      </FormField>

      {mode === "signup" ? (
        <>
          <FormField label="Nombre">
            <TextInput
              className={`${inputBaseClass} ${inputThemeClass}`}
              placeholder="Tu nombre"
              placeholderTextColor="#64748b"
              value={form.firstName}
              onChangeText={(v) => onFormChange("firstName", v)}
              editable={!signing}
            />
          </FormField>
          <FormField label="Apellido">
            <TextInput
              className={`${inputBaseClass} ${inputThemeClass}`}
              placeholder="Tu apellido"
              placeholderTextColor="#64748b"
              value={form.lastName}
              onChangeText={(v) => onFormChange("lastName", v)}
              editable={!signing}
            />
          </FormField>
          <ActionButton label="Crear cuenta" onPress={onSubmit} loading={signing} />
        </>
      ) : (
        <>
          <ActionButton label="Entrar" onPress={onSubmit} loading={signing} />
          <View className="my-4 flex-row items-center gap-3">
            <View className={`h-[1px] flex-1 ${isDark ? "bg-red-500/20" : "bg-slate-200"}`} />
            <Text className={`text-xs font-bold uppercase ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              o
            </Text>
            <View className={`h-[1px] flex-1 ${isDark ? "bg-red-500/20" : "bg-slate-200"}`} />
          </View>
          <ActionButton
            label="Continuar con Google"
            variant="secondary"
            onPress={onGoogleLogin}
            loading={signing}
          />
        </>
      )}
    </View>
  );
}
