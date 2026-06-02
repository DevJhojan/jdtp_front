import React from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "../../../context/ThemeContext";

export function AuthHero() {
  const { isDark } = useAppTheme();

  return (
    <View
      className={`mb-6 rounded-2xl border p-6 ${
        isDark ? "border-red-500/25 bg-zinc-950/85" : "border-slate-300 bg-white/90"
      }`}
    >
      <Text
        className={`text-sm font-bold uppercase tracking-[4px] ${
          isDark ? "text-red-300" : "text-red-700"
        }`}
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
        Inicia sesión o crea una cuenta para gestionar cuentas, ingresos, gastos y transferencias en
        almacenamiento local offline.
      </Text>
    </View>
  );
}
