import { Text, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

interface MetricCardProps {
  label: string;
  value: string;
  helper?: string;
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
  const { isDark } = useAppTheme();

  return (
    <View
      className={`min-h-28 flex-1 rounded-2xl border p-4 ${isDark ? "border-red-500/15 bg-zinc-950/80" : "border-slate-300 bg-white"}`}
    >
      <Text
        className={`text-sm font-semibold uppercase tracking-widest ${isDark ? "text-red-300" : "text-red-700"}`}
      >
        {label}
      </Text>
      <Text
        className={`mt-3 text-3xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
      >
        {value}
      </Text>
      {helper ? (
        <Text
          className={`mt-2 text-sm leading-5 ${isDark ? "text-slate-300" : "text-slate-600"}`}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
