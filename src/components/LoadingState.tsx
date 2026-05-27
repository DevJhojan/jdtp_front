import { ActivityIndicator, Text, View } from "react-native";

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Cargando información financiera...",
}: LoadingStateProps) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-6">
      <ActivityIndicator size="large" color="#ef4444" />
      <Text className="mt-4 text-base text-slate-200">{message}</Text>
    </View>
  );
}
