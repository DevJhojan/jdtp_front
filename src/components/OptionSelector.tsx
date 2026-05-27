import { Pressable, Text, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

interface OptionItem<T extends string | number> {
  value: T;
  label: string;
}

interface OptionSelectorProps<T extends string | number> {
  value: T;
  options: Array<OptionItem<T>>;
  onChange: (value: T) => void;
}

export function OptionSelector<T extends string | number>({
  value,
  options,
  onChange,
}: OptionSelectorProps<T>) {
  const { isDark } = useAppTheme();

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={String(option.value)}
            className={`rounded-lg border px-3 py-2 ${
              selected
                ? isDark
                  ? "border-red-400 bg-red-500/20"
                  : "border-red-500 bg-red-100"
                : isDark
                  ? "border-red-500/15 bg-zinc-950/80"
                  : "border-slate-300 bg-white"
            }`}
            onPress={() => onChange(option.value)}
          >
            <Text
              className={`text-sm font-medium ${
                selected
                  ? isDark
                    ? "text-red-100"
                    : "text-red-700"
                  : isDark
                    ? "text-slate-300"
                    : "text-slate-700"
              }`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
