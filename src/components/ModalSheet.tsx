import { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../context/ThemeContext";

interface ModalSheetProps extends PropsWithChildren {
  visible: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
}

export function ModalSheet({
  children,
  visible,
  title,
  subtitle,
  onClose,
}: ModalSheetProps) {
  const { isDark } = useAppTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className={`flex-1 justify-end ${isDark ? "bg-black/70" : "bg-slate-900/35"}`}
      >
        <View
          className={`max-h-[88%] rounded-t-2xl border px-5 pb-8 pt-5 ${isDark ? "border-red-500/20 bg-zinc-950" : "border-slate-200 bg-white"}`}
        >
          <View className="mb-5 flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text
                className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
              >
                {title}
              </Text>
              <Text
                className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                {subtitle}
              </Text>
            </View>
            <Pressable
              className={`rounded-lg p-2 ${isDark ? "bg-red-500/10" : "bg-slate-100"}`}
              onPress={onClose}
            >
              <Ionicons
                name="close"
                size={22}
                color={isDark ? "#f8fafc" : "#0f172a"}
              />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
