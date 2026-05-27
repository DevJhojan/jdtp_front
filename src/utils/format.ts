export function formatCurrency(value: number | string): string {
  const numeric = typeof value === "number" ? value : Number(value);
  const safeValue = Number.isFinite(numeric) ? numeric : 0;

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2,
  }).format(safeValue);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
