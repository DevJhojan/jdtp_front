import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ActionButton } from "../components/ActionButton";
import { AppScreen } from "../components/AppScreen";
import { useAuth } from "../context/AuthContext";
import { useAppTheme } from "../context/ThemeContext";
import { getApiErrorMessage } from "../services/client";
import {
  exportBackupToDevice,
  importBackupFromDevice,
} from "../services/backup";
import { syncData } from "../services/sync";
import type { RootStackParamList } from "../types/navigation";

type SettingsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Configuracion"
>;

export function SettingsScreen() {
  const navigation = useNavigation<SettingsNavigationProp>();
  const { signOut } = useAuth();
  const { isDark, toggleTheme } = useAppTheme();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncData();
      Alert.alert(
        "Sincronización exitosa",
        "Los datos han sido subidos a la nube y se han descargado registros nuevos sin duplicados."
      );
    } catch (error) {
      Alert.alert("Error de sincronización", getApiErrorMessage(error));
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportBackupToDevice();
      Alert.alert(
        "Exportación completada",
        "El respaldo fue generado. Si corresponde, se solicitó permiso para guardar o compartir el archivo.",
      );
    } catch (error) {
      Alert.alert("No se pudo exportar", getApiErrorMessage(error));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const imported = await importBackupFromDevice();
      if (!imported) {
        return;
      }

      Alert.alert(
        "Importación completada",
        "Los datos fueron restaurados. Se cerrará la sesión actual para recargar la información importada.",
        [{ text: "Continuar", onPress: () => void signOut() }],
      );
    } catch (error) {
      Alert.alert("No se pudo importar", getApiErrorMessage(error));
    } finally {
      setImporting(false);
    }
  };

  return (
    <AppScreen
      title="Configuración"
      subtitle="Administra las preferencias del aplicativo y tu sesión local."
      headerAction={
        <Pressable
          onPress={() => navigation.goBack()}
          className={`h-11 w-11 items-center justify-center rounded-xl border ${isDark ? "border-red-500/35 bg-red-500/10" : "border-slate-300 bg-white"}`}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={isDark ? "#fca5a5" : "#1e293b"}
          />
        </Pressable>
      }
    >
      <View className="gap-3">
        <ActionButton
          label="Sincronizar con la nube"
          variant="primary"
          onPress={handleSync}
          loading={syncing}
          disabled={exporting || importing}
        />
        <ActionButton
          label="Exportar datos"
          variant="secondary"
          onPress={handleExport}
          loading={exporting}
          disabled={importing || syncing}
        />
        <ActionButton
          label="Importar datos"
          variant="secondary"
          onPress={handleImport}
          loading={importing}
          disabled={exporting || syncing}
        />
        <ActionButton
          label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          variant="secondary"
          onPress={toggleTheme}
          disabled={exporting || importing || syncing}
        />
        <ActionButton
          label="Salir"
          variant="danger"
          onPress={() => void signOut()}
          disabled={exporting || importing || syncing}
        />
      </View>
      <Text
        className={`mt-5 text-sm leading-6 ${isDark ? "text-slate-300" : "text-slate-600"}`}
      >
        La sincronización utiliza Firebase Realtime Database para mantener tus datos seguros en la nube y disponibles en otros dispositivos.
      </Text>
    </AppScreen>
  );
}
