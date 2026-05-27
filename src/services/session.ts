import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AuthSession } from "../types/api";

const SESSION_STORAGE_KEY = "jdtp-front-auth-session";

export async function readSession(): Promise<AuthSession | null> {
  const raw = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as AuthSession;
}

export async function writeSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
}
