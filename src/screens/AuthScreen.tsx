import React from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionButton } from "../components/ActionButton";
import { FeedbackBanner } from "../components/FeedbackBanner";
import { useAppTheme } from "../context/ThemeContext";

import { useAuthScreen } from "./auth/useAuthScreen";
import { AuthHero } from "./auth/components/AuthHero";
import { AuthForm } from "./auth/components/AuthForm";

export function AuthScreen() {
  const { isDark, toggleTheme } = useAppTheme();
  
  const {
    mode,
    signing,
    form,
    authError,
    resetMode,
    handleFormChange,
    handleLogin,
    handleSignUp,
    handleGoogleLogin,
  } = useAuthScreen();

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
            className={`h-11 w-11 items-center justify-center rounded-xl border ${
              isDark ? "border-red-500/35 bg-red-500/10" : "border-slate-300 bg-white"
            }`}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={20}
              color={isDark ? "#fca5a5" : "#1e293b"}
            />
          </Pressable>
        </View>

        <View className="flex-1 justify-center">
          <AuthHero />

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

          {authError ? <FeedbackBanner variant="error" message={authError} /> : null}

          <AuthForm
            mode={mode}
            signing={signing}
            form={form}
            onFormChange={handleFormChange}
            onSubmit={mode === "login" ? handleLogin : handleSignUp}
            onGoogleLogin={handleGoogleLogin}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
