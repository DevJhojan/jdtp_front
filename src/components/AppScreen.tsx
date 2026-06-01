import { PropsWithChildren, ReactNode } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { useAppTheme } from "../context/ThemeContext";

interface AppScreenProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  headerAction?: ReactNode;
}

export function AppScreen({
  children,
  title,
  subtitle,
  refreshing = false,
  onRefresh,
  headerAction,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  const gradientColors = isDark
    ? (["#09090b", "#111111", "#1f1111", "#2b1010"] as const)
    : (["#f8fafc", "#fef2f2", "#fff1f2", "#fffbeb"] as const);

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void onRefresh()}
                tintColor={isDark ? "#ef4444" : "#dc2626"}
              />
            ) : undefined
          }
        >
          <View className="px-5 pb-8 pt-6">
            <View
              className={`mb-6 rounded-2xl border p-5 ${isDark ? "border-red-500/20 bg-zinc-950/80" : "border-slate-300 bg-white/90"}`}
            >
              <View className="mb-4 flex-row items-start justify-between gap-4">
                <View className="flex-1">
                  <View
                    className={`mb-3 self-start rounded-lg border px-3 py-1 ${isDark ? "border-red-400/30 bg-red-500/10" : "border-amber-400/40 bg-amber-100"}`}
                  >
                    <Text
                      className={`text-sm font-bold uppercase tracking-[2px] ${isDark ? "text-red-100" : "text-amber-700"}`}
                    >
                      {isDark ? "Modo oscuro" : "Modo claro"}
                    </Text>
                  </View>
                  <Text
                    className={`text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    {title}
                  </Text>
                  <Text
                    className={`mt-3 text-sm leading-7 ${isDark ? "text-slate-300" : "text-slate-600"}`}
                  >
                    {subtitle}
                  </Text>
                </View>
                {headerAction}
              </View>
            </View>

            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
