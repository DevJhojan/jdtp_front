import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "../components/ActionButton";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { FormField } from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";

const inputBaseClass = "rounded-xl border px-4 py-3 placeholder:text-slate-400";

export function AuthScreen() {
  const { isDark, toggleTheme } = useAppTheme();
  const { authError, clearAuthError, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signing, setSigning] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const inputThemeClass = isDark
    ? "border-red-500/20 bg-red-500/5 text-red-50"
    : "border-slate-300 bg-white text-slate-900";

  const resetMode = (nextMode: "login" | "signup") => {
    clearAuthError();
    setMode(nextMode);
  };

  const handleLogin = async () => {
    setSigning(true);
    try {
      await signIn({
        email: email.trim(),
        password,
      });
    } finally {
      setSigning(false);
    }
  };

  const handleSignUp = async () => {
    setSigning(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
      });
    } finally {
      setSigning(false);
    }
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ["#09090b", "#111111", "#1f1111", "#2b1010"]
          : ["#f8fafc", "#fff1f2", "#fff7ed"]
      }
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1 px-5 py-6">
        <View className="mb-4 flex-row justify-end">
          <Pressable
            onPress={toggleTheme}
            className={`h-11 w-11 items-center justify-center rounded-xl border ${isDark ? "border-red-500/35 bg-red-500/10" : "border-slate-300 bg-white"}`}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={20}
              color={isDark ? "#fca5a5" : "#1e293b"}
            />
          </Pressable>
        </View>

        <View className="flex-1 justify-center">
          <View
            className={`mb-6 rounded-2xl border p-6 ${isDark ? "border-red-500/25 bg-zinc-950/85" : "border-slate-300 bg-white/90"}`}
          >
            <Text
              className={`text-sm font-bold uppercase tracking-[4px] ${isDark ? "text-red-300" : "text-red-700"}`}
            >
              JDTP Finance
            </Text>
            <Text
              className={`mt-4 text-4xl font-black ${isDark ? "text-red-50" : "text-slate-900"}`}
            >
              Tu dinero, claro y en movimiento
            </Text>
            <Text
              className={`mt-4 text-sm leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              Inicia sesión o crea una cuenta para gestionar cuentas, ingresos,
              gastos y transferencias en almacenamiento local offline.
            </Text>
          </View>

          <View className="mb-4 flex-row gap-3">
            <View className="flex-1">
              <ActionButton
                label="Iniciar sesión"
                variant={mode === "login" ? "primary" : "secondary"}
                onPress={() => resetMode("login")}
              />
            </View>
            <View className="flex-1">
              <ActionButton
                label="Registrarme"
                variant={mode === "signup" ? "primary" : "secondary"}
                onPress={() => resetMode("signup")}
              />
            </View>
          </View>

          {authError ? (
            <FeedbackBanner variant="error" message={authError} />
          ) : null}

          <View
            className={`rounded-2xl border p-5 ${isDark ? "border-red-500/20 bg-zinc-950/85" : "border-slate-300 bg-white/90"}`}
          >
            <FormField label="Correo">
              <TextInput
                className={`${inputBaseClass} ${inputThemeClass}`}
                placeholder="correo@dominio.com"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
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
                value={password}
                onChangeText={setPassword}
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
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={!signing}
                  />
                </FormField>
                <FormField label="Apellido">
                  <TextInput
                    className={`${inputBaseClass} ${inputThemeClass}`}
                    placeholder="Tu apellido"
                    placeholderTextColor="#64748b"
                    value={lastName}
                    onChangeText={setLastName}
                    editable={!signing}
                  />
                </FormField>
                <ActionButton
                  label="Crear cuenta"
                  onPress={handleSignUp}
                  loading={signing}
                />
              </>
            ) : (
              <ActionButton
                label="Entrar"
                onPress={handleLogin}
                loading={signing}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
