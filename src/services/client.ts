let currentAuthToken: string | null = null;

export function setAuthToken(token: string | null) {
  currentAuthToken = token;
}

export function isNetworkError(error: unknown): boolean {
  return false;
}

export function getAuthToken(): string | null {
  return currentAuthToken;
}

function isDevelopment(): boolean {
  if (typeof __DEV__ !== "undefined") {
    return __DEV__;
  }

  return process.env.NODE_ENV !== "production";
}

function logCompleteError(error: unknown): void {
  const devMode = isDevelopment();

  console.log("🔴 [BOOTSTRAP DEBUG] Error detectado:", error);

  if (error instanceof Error) {
    console.error("[APP ERROR DETAILED]", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    return;
  }

  console.error("[UNKNOWN ERROR]", JSON.stringify(error, null, 2));
}

function flattenApiPayload(payload: unknown): string[] {
  if (typeof payload === "string") {
    return [payload];
  }

  if (Array.isArray(payload)) {
    return payload.flatMap((item) => flattenApiPayload(item));
  }

  if (payload && typeof payload === "object") {
    return Object.entries(payload as Record<string, unknown>).flatMap(
      ([key, value]) => {
        const nested = flattenApiPayload(value);
        if (key === "non_field_errors" || key === "detail") {
          return nested;
        }

        return nested.map((entry) => `${key}: ${entry}`);
      },
    );
  }

  return [];
}

export function getApiErrorMessage(error: unknown): string {
  logCompleteError(error);

  if (error instanceof Error) {
    return error.message;
  }

  const messages = flattenApiPayload(error);
  if (messages.length > 0) {
    return messages.join("\n");
  }

  return "Ocurrio un error inesperado en almacenamiento local.";
}
