import { ActivityIndicator, Pressable, Text } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

interface ActionButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
}

export function ActionButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: ActionButtonProps) {
  const { isDark } = useAppTheme();

  const variantStyles = {
    primary: isDark ? "bg-red-500 border-red-400" : "bg-red-600 border-red-500",
    secondary: isDark
      ? "bg-zinc-950/80 border-red-500/25"
      : "bg-white border-slate-300",
    danger: isDark ? "bg-rose-700 border-rose-500" : "bg-rose-600 border-rose-500",
  };

  const textStyles = {
    primary: "text-white",
    secondary: isDark ? "text-red-100" : "text-slate-800",
    danger: "text-white",
  };

  return (
    <Pressable
      className={`min-h-12 flex-row items-center justify-center rounded-xl border px-4 shadow-lg ${
        variantStyles[variant]
      } ${disabled ? "opacity-50" : ""}`}
      disabled={disabled || loading}
      onPress={() => void onPress()}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "secondary" && !isDark ? "#1e293b" : "#ffffff"}
        />
      ) : (
        <Text className={`font-bold ${textStyles[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
