import { Text, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  const { isDark } = useAppTheme();

  return (
    <View
      className={`rounded-2xl border border-dashed p-5 ${isDark ? "border-red-500/15 bg-zinc-950/80" : "border-slate-300 bg-white/90"}`}
    >
      <Text
        className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}
      >
        {title}
      </Text>
      <Text
        className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}
      >
        {description}
      </Text>
    </View>
  );
}
