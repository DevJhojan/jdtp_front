import "./global.css";

import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, Theme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { ThemeProvider, useAppTheme } from "./src/context/ThemeContext";
import { LoadingState } from "./src/components/LoadingState";
import { AccountsScreen } from "./src/screens/AccountsScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { TransactionsScreen } from "./src/screens/TransactionsScreen";
import { TransfersScreen } from "./src/screens/TransfersScreen";
import { AccountFormScreen } from "./src/screens/forms/AccountFormScreen";
import { TransactionFormScreen } from "./src/screens/forms/TransactionFormScreen";
import { TransferFormScreen } from "./src/screens/forms/TransferFormScreen";
import type { RootStackParamList, RootTabParamList } from "./src/types/navigation";

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const darkNavigationTheme: Theme = {
  dark: true,
  colors: {
    primary: "#ef4444",
    background: "#09090b",
    card: "#111111",
    text: "#fafafa",
    border: "#3f1d1d",
    notification: "#dc2626",
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" },
    medium: { fontFamily: "System", fontWeight: "500" },
    bold: { fontFamily: "System", fontWeight: "700" },
    heavy: { fontFamily: "System", fontWeight: "800" },
  },
};

const lightNavigationTheme: Theme = {
  dark: false,
  colors: {
    primary: "#dc2626",
    background: "#f8fafc",
    card: "#ffffff",
    text: "#0f172a",
    border: "#e2e8f0",
    notification: "#dc2626",
  },
  fonts: {
    regular: { fontFamily: "System", fontWeight: "400" },
    medium: { fontFamily: "System", fontWeight: "500" },
    bold: { fontFamily: "System", fontWeight: "700" },
    heavy: { fontFamily: "System", fontWeight: "800" },
  },
};

const screenIcons: Record<
  keyof RootTabParamList,
  keyof typeof Ionicons.glyphMap
> = {
  Resumen: "analytics",
  Cuentas: "wallet",
  Movimientos: "swap-horizontal",
  Transferencias: "send",
};

function AppTabs() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: isDark ? "#f87171" : "#dc2626",
        tabBarInactiveTintColor: isDark ? "#a1a1aa" : "#64748b",
        tabBarStyle: {
          backgroundColor: isDark ? "#09090b" : "#ffffff",
          borderTopColor: isDark ? "#3f1d1d" : "#e2e8f0",
          borderTopWidth: 1,
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(10, insets.bottom),
          shadowColor: isDark ? "#7f1d1d" : "#94a3b8",
          shadowOpacity: 0.22,
          shadowRadius: 14,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={screenIcons[route.name as keyof RootTabParamList]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="Resumen" component={DashboardScreen} />
      <Tab.Screen name="Cuentas" component={AccountsScreen} />
      <Tab.Screen name="Movimientos" component={TransactionsScreen} />
      <Tab.Screen name="Transferencias" component={TransfersScreen} />
    </Tab.Navigator>
  );
}

function AppNavigation() {
  const { isDark } = useAppTheme();

  return (
    <NavigationContainer
      theme={isDark ? darkNavigationTheme : lightNavigationTheme}
    >
      <StatusBar style={isDark ? "light" : "dark"} />
      <AppGate />
    </NavigationContainer>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="Configuracion" component={SettingsScreen} />
      <Stack.Screen name="NuevaCuenta" component={AccountFormScreen} />
      <Stack.Screen name="NuevoMovimiento" component={TransactionFormScreen} />
      <Stack.Screen name="NuevaTransferencia" component={TransferFormScreen} />
    </Stack.Navigator>
  );
}

function AppGate() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingState message="Cargando tu base local financiera..." />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <AppStack />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppNavigation />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
