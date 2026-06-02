import { useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";

export function useAuthScreen() {
  const { authError, clearAuthError, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [signing, setSigning] = useState(false);
  
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const resetMode = (nextMode: "login" | "signup") => {
    clearAuthError();
    setMode(nextMode);
  };

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async () => {
    setSigning(true);
    try {
      await signIn({
        email: form.email.trim(),
        password: form.password,
      });
    } finally {
      setSigning(false);
    }
  };

  const handleSignUp = async () => {
    setSigning(true);
    try {
      await signUp({
        email: form.email.trim(),
        password: form.password,
        first_name: form.firstName.trim() || undefined,
        last_name: form.lastName.trim() || undefined,
      });
    } finally {
      setSigning(false);
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert(
      "Inicio de sesión con Google",
      "El inicio de sesión con Google requiere un binario nativo personalizado y no es compatible con la aplicación Expo Go.\n\nPor favor, regístrate o inicia sesión usando correo y contraseña."
    );
  };

  return {
    mode,
    signing,
    form,
    authError,
    resetMode,
    handleFormChange,
    handleLogin,
    handleSignUp,
    handleGoogleLogin,
  };
}
