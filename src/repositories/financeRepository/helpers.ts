export function sanitizeText(value: string | undefined): string {
  return (value ?? "").trim();
}

export function normalizeAmountString(amount: string): string {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("Debes ingresar un monto valido mayor a 0.");
  }

  return numeric.toFixed(2);
}

export function assertValidDate(value: string): string {
  const trimmed = sanitizeText(value);
  if (!trimmed) {
    throw new Error("La fecha es obligatoria.");
  }

  const timestamp = Date.parse(trimmed);
  if (Number.isNaN(timestamp)) {
    throw new Error("La fecha debe estar en formato valido (YYYY-MM-DD).");
  }

  return trimmed;
}

export function assertDifferentAccounts(fromAccount: number, toAccount: number): void {
  if (fromAccount === toAccount) {
    throw new Error("La cuenta origen y destino deben ser diferentes.");
  }
}
