import { format } from "date-fns";
import { cs } from "date-fns/locale";

export const KWH_PER_GJ = 1_000_000_000 / 3_600_000; // 277.777…

export type Unit = "KWH" | "M3" | "GJ";

export function unitLabel(unit: Unit): string {
  switch (unit) {
    case "KWH":
      return "kWh";
    case "M3":
      return "m³";
    case "GJ":
      return "GJ";
  }
}

export type MeterType = "ELECTRICITY" | "COLD_WATER" | "HOT_WATER" | "HEAT";

export function meterTypeLabel(t: MeterType): string {
  switch (t) {
    case "ELECTRICITY":
      return "Elektřina";
    case "COLD_WATER":
      return "Studená voda";
    case "HOT_WATER":
      return "Teplá voda";
    case "HEAT":
      return "Teplo";
  }
}

const nf = new Intl.NumberFormat("cs-CZ", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

const nfPrice = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  maximumFractionDigits: 2,
});

export function formatNumber(n: number): string {
  return nf.format(n);
}

export function formatValue(n: number, unit: Unit): string {
  return `${nf.format(n)} ${unitLabel(unit)}`;
}

export function formatPrice(n: number): string {
  return nfPrice.format(n);
}

export function formatDate(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return format(dt, "d. M. yyyy", { locale: cs });
}

export function formatMonth(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d) : d;
  return format(dt, "LLLL yyyy", { locale: cs });
}

export function toIsoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function parseIsoDate(s: string): Date {
  // Treat as local midnight to avoid TZ shifts when storing date-only values.
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
}

/** Validates a date-only value before it is converted for storage. */
export function isIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;

  const date = parseIsoDate(s);
  return !Number.isNaN(date.getTime()) && toIsoDate(date) === s;
}
