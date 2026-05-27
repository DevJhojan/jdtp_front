import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

interface FeedbackBannerProps {
  message: string;
  variant?: "error" | "info";
}

export function FeedbackBanner({
  message,
  variant = "info",
}: FeedbackBannerProps) {
  const { isDark } = useAppTheme();
  const isError = variant === "error";

  return (
    <View
      className={`mb-4 flex-row items-start gap-3 rounded-xl border p-4 ${
        isError
          ? isDark
            ? "border-rose-400/30 bg-rose-500/10"
            : "border-rose-300 bg-rose-100"
          : isDark
            ? "border-red-400/20 bg-red-500/10"
            : "border-red-300 bg-red-50"
      }`}
    >
      <Ionicons
        name={isError ? "warning" : "information-circle"}
        size={20}
        color={
          isError
            ? isDark
              ? "#fb7185"
              : "#be123c"
            : isDark
              ? "#f87171"
              : "#b91c1c"
        }
      />
      <Text
        className={`flex-1 text-sm leading-6 ${isError ? (isDark ? "text-rose-100" : "text-rose-700") : isDark ? "text-red-100" : "text-red-700"}`}
      >
        {message}
      </Text>
    </View>
  );
}
