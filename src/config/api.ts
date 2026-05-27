import Constants from "expo-constants";
import { NativeModules, Platform } from "react-native";

const LOCAL_BACKEND_PORT = "8000";

interface ExpoGoConfigLike {
  debuggerHost?: string;
  developer?: {
    tool?: string;
  };
}

function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function extractHostname(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const withScheme = trimmed.includes("://") ? trimmed : `http://${trimmed}`;

  try {
    return new URL(withScheme).hostname;
  } catch {
    return null;
  }
}

function isUsableHost(host: string | null): host is string {
  return Boolean(host && !["localhost", "127.0.0.1", "::1"].includes(host));
}

function getExpoBundleHost(): string | null {
  const expoGoConfig = Constants.expoGoConfig as ExpoGoConfigLike | null;
  const candidates = [
    extractHostname(expoGoConfig?.debuggerHost),
    extractHostname(Constants.expoConfig?.hostUri),
    extractHostname(Constants.platform?.hostUri),
    extractHostname(Constants.linkingUri),
    extractHostname(Constants.experienceUrl),
    extractHostname(NativeModules.SourceCode?.scriptURL),
  ];

  return candidates.find((candidate) => isUsableHost(candidate)) ?? null;
}

function getDefaultBackendBaseUrl(): string {
  const expoHost = getExpoBundleHost();

  if (expoHost && expoHost !== "localhost" && expoHost !== "127.0.0.1") {
    return `http://${expoHost}:${LOCAL_BACKEND_PORT}/`;
  }

  if (Platform.OS === "android") {
    return `http://10.0.2.2:${LOCAL_BACKEND_PORT}/`;
  }

  return `http://127.0.0.1:${LOCAL_BACKEND_PORT}/`;
}

const envBackendBaseUrl = process.env.EXPO_PUBLIC_BACKEND_BASE_URL?.trim();

export const BACKEND_BASE_URL = normalizeBaseUrl(
  envBackendBaseUrl || getDefaultBackendBaseUrl(),
);
export const API_BASE_URL = `${BACKEND_BASE_URL}api/`;
export const BACKEND_RESOLUTION_SOURCE = envBackendBaseUrl
  ? "env"
  : getExpoBundleHost()
    ? "expo-host"
    : Platform.OS === "android"
      ? "android-emulator-fallback"
      : "localhost-fallback";
