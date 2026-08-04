import { differenceInCalendarDays } from "date-fns";
import { KWH_PER_GJ } from "./format";

export type ReadingRow = {
  id: number;
  date: Date;
  value: number;
};

export type TariffRow = {
  validFrom: Date;
  unitPrice: number;
  monthlyFee: number;
};

export type ReadingWithDelta = ReadingRow & {
  prevValue: number | null;
  consumption: number | null;
  days: number | null;
  dailyAvg: number | null;
};

/** Adds consumption delta vs. previous reading to each row. Expects readings sorted by date ASC. */
export function withConsumption(readings: ReadingRow[]): ReadingWithDelta[] {
  return readings.map((r, i) => {
    const prev = i > 0 ? readings[i - 1] : null;
    if (!prev) {
      return { ...r, prevValue: null, consumption: null, days: null, dailyAvg: null };
    }
    const consumption = r.value - prev.value;
    const days = differenceInCalendarDays(r.date, prev.date);
    const dailyAvg = days > 0 ? consumption / days : null;
    return { ...r, prevValue: prev.value, consumption, days, dailyAvg };
  });
}

export function gjToKwh(gj: number): number {
  return gj * KWH_PER_GJ;
}

/** Linear interpolation of meter value for a given date between two readings. */
function interpolate(prev: ReadingRow, next: ReadingRow, at: Date): number {
  const total = differenceInCalendarDays(next.date, prev.date);
  if (total <= 0) return prev.value;
  const within = differenceInCalendarDays(at, prev.date);
  const ratio = Math.max(0, Math.min(1, within / total));
  return prev.value + (next.value - prev.value) * ratio;
}

/**
 * Returns approximate consumption between two dates by linearly interpolating
 * against the nearest readings. Returns null if there isn't enough data.
 */
export function consumptionBetween(
  readings: ReadingRow[],
  from: Date,
  to: Date,
): number | null {
  if (readings.length < 2 || from >= to) return null;
  const sorted = [...readings].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (to < first.date || from > last.date) return null;

  const valueAt = (at: Date): number | null => {
    if (at <= first.date) return first.value;
    if (at >= last.date) return last.value;
    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      if (at >= a.date && at <= b.date) return interpolate(a, b, at);
    }
    return null;
  };

  const v1 = valueAt(from);
  const v2 = valueAt(to);
  if (v1 == null || v2 == null) return null;
  return Math.max(0, v2 - v1);
}

/**
 * Returns the tariff segments that apply within [from, to], each clipped to that range.
 * Tariffs are sorted by validFrom ASC. If there is no tariff covering the start, the
 * earliest tariff is treated as covering from the period start.
 */
function tariffSegments(tariffs: TariffRow[], from: Date, to: Date) {
  if (tariffs.length === 0) return [];
  const sorted = [...tariffs].sort((a, b) => a.validFrom.getTime() - b.validFrom.getTime());

  const boundaries = sorted.map((t) => t.validFrom);
  const segments: { from: Date; to: Date; tariff: TariffRow }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    const segStart = i === 0 ? new Date(Math.min(from.getTime(), t.validFrom.getTime())) : boundaries[i];
    const segEnd = i + 1 < sorted.length ? boundaries[i + 1] : new Date(8640000000000000);

    const clippedFrom = new Date(Math.max(segStart.getTime(), from.getTime()));
    const clippedTo = new Date(Math.min(segEnd.getTime(), to.getTime()));
    if (clippedFrom < clippedTo) {
      segments.push({ from: clippedFrom, to: clippedTo, tariff: t });
    }
  }
  return segments;
}

function monthsBetween(from: Date, to: Date): number {
  // Fractional months by days / average month length — good enough for paušál proration.
  const days = differenceInCalendarDays(to, from);
  return days / 30.4375;
}

export type PriceBreakdown = {
  consumption: number; // units in meter unit
  unitCost: number; // Kč
  feeCost: number; // Kč
  total: number; // Kč
  segments: {
    from: Date;
    to: Date;
    consumption: number;
    unitPrice: number;
    monthlyFee: number;
    unitCost: number;
    feeCost: number;
  }[];
};

/**
 * Computes price for a period using historical tariffs. Consumption is split between
 * tariff segments linearly by days (we don't know per-day usage detail).
 */
export function priceForPeriod(
  readings: ReadingRow[],
  tariffs: TariffRow[],
  from: Date,
  to: Date,
): PriceBreakdown | null {
  const totalConsumption = consumptionBetween(readings, from, to);
  if (totalConsumption == null) return null;
  if (tariffs.length === 0) {
    return {
      consumption: totalConsumption,
      unitCost: 0,
      feeCost: 0,
      total: 0,
      segments: [],
    };
  }

  const segs = tariffSegments(tariffs, from, to);
  const totalDays = differenceInCalendarDays(to, from);
  if (totalDays <= 0) return null;

  const segments = segs.map((s) => {
    const days = differenceInCalendarDays(s.to, s.from);
    const cons = totalConsumption * (days / totalDays);
    const unitCost = cons * s.tariff.unitPrice;
    const feeCost = s.tariff.monthlyFee * monthsBetween(s.from, s.to);
    return {
      from: s.from,
      to: s.to,
      consumption: cons,
      unitPrice: s.tariff.unitPrice,
      monthlyFee: s.tariff.monthlyFee,
      unitCost,
      feeCost,
    };
  });

  const unitCost = segments.reduce((acc, s) => acc + s.unitCost, 0);
  const feeCost = segments.reduce((acc, s) => acc + s.feeCost, 0);
  return {
    consumption: totalConsumption,
    unitCost,
    feeCost,
    total: unitCost + feeCost,
    segments,
  };
}

/** Aggregates consumption into calendar months between two dates. */
export function monthlyConsumption(
  readings: ReadingRow[],
  from: Date,
  to: Date,
): { month: Date; consumption: number }[] {
  const months: { month: Date; consumption: number }[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  const periodEndBoundary = new Date(
    to.getFullYear(),
    to.getMonth(),
    to.getDate(),
  );
  while (cursor < periodEndBoundary) {
    const monthStart = new Date(cursor);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const periodStart = monthStart < from ? from : monthStart;
    const periodEnd = monthEnd > periodEndBoundary ? periodEndBoundary : monthEnd;
    const cons = consumptionBetween(readings, periodStart, periodEnd);
    months.push({ month: new Date(cursor), consumption: cons ?? 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}
