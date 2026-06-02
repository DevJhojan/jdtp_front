import React from "react";
import { Text, View } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { useAppTheme } from "../../../context/ThemeContext";

export function DashboardHeader() {
  const { user } = useAuth();
  const { isDark } = useAppTheme();

  return (
    <View
      className={`mb-4 rounded-3xl border px-6 py-5 ${isDark ? "border-red-500/20 bg-[#180206]" : "border-red-200 bg-white"}`}
    >
      <Text
        className={`text-sm font-bold uppercase tracking-[3px] ${isDark ? "text-red-200/70" : "text-red-700"}`}
      >
        Sesión activa
      </Text>
      <Text
        className={`mt-3 text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
      >
        {user?.first_name?.trim()
          ? `${user.first_name} ${user.last_name}`.trim()
          : user?.email}
      </Text>
      <Text
        className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}
      >
        {user?.email}
      </Text>
    </View>
  );
}
