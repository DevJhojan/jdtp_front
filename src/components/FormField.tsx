import { PropsWithChildren } from "react";
import { Text, View } from "react-native";
import { useAppTheme } from "../context/ThemeContext";

interface FormFieldProps extends PropsWithChildren {
  label: string;
  hint?: string;
}

export function FormField({ label, hint, children }: FormFieldProps) {
  const { isDark } = useAppTheme();

  return (
    <View className="mb-4">
      <Text
        className={`mb-2 text-sm font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}
      >
        {label}
      </Text>
      {children}
      {hint ? (
        <Text
            className={`mt-2 text-sm leading-5 ${isDark ? "text-slate-400" : "text-slate-500"}`}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
