import { describe, expect, it } from "vitest";
import {
  consumptionBetween,
  gjToKwh,
  monthlyConsumption,
  priceForPeriod,
  withConsumption,
} from "./calculations";

const d = (s: string) => new Date(s);

describe("withConsumption", () => {
  it("computes delta against previous reading", () => {
    const rows = withConsumption([
      { id: 1, date: d("2026-01-01"), value: 1000 },
      { id: 2, date: d("2026-02-01"), value: 1080 },
      { id: 3, date: d("2026-03-01"), value: 1130 },
    ]);
    expect(rows[0].consumption).toBeNull();
    expect(rows[1].consumption).toBe(80);
    expect(rows[2].consumption).toBe(50);
    expect(rows[1].days).toBe(31);
    expect(rows[1].dailyAvg).toBeCloseTo(80 / 31);
  });
});

describe("gjToKwh", () => {
  it("converts 1 GJ to ~277.78 kWh", () => {
    expect(gjToKwh(1)).toBeCloseTo(277.7778, 3);
    expect(gjToKwh(10)).toBeCloseTo(2777.78, 2);
  });
});

describe("consumptionBetween", () => {
  const readings = [
    { id: 1, date: d("2026-01-01"), value: 0 },
    { id: 2, date: d("2026-02-01"), value: 100 },
    { id: 3, date: d("2026-03-01"), value: 150 },
  ];

  it("interpolates linearly between readings", () => {
    // mid-January should be ~50 (half of Jan consumption of 100)
    const c = consumptionBetween(readings, d("2026-01-01"), d("2026-01-16"));
    expect(c).toBeCloseTo(100 * (15 / 31), 1);
  });

  it("returns full known consumption across the data span", () => {
    expect(consumptionBetween(readings, d("2026-01-01"), d("2026-03-01"))).toBe(150);
  });

  it("returns null with insufficient data", () => {
    expect(consumptionBetween([readings[0]], d("2026-01-01"), d("2026-03-01"))).toBeNull();
  });
});

describe("priceForPeriod", () => {
  const readings = [
    { id: 1, date: d("2026-01-01"), value: 0 },
    { id: 2, date: d("2026-12-31"), value: 365 }, // 1 unit/day for a year
  ];

  it("computes price with a single tariff", () => {
    const r = priceForPeriod(
      readings,
      [{ validFrom: d("2025-01-01"), unitPrice: 10, monthlyFee: 100 }],
      d("2026-01-01"),
      d("2026-12-31"),
    );
    expect(r).not.toBeNull();
    expect(r!.consumption).toBeCloseTo(365, 1);
    expect(r!.unitCost).toBeCloseTo(3650, 1);
    // ~11.97 months at 100 Kč
    expect(r!.feeCost).toBeGreaterThan(1100);
    expect(r!.feeCost).toBeLessThan(1300);
  });

  it("respects tariff change mid-period", () => {
    const r = priceForPeriod(
      readings,
      [
        { validFrom: d("2025-01-01"), unitPrice: 10, monthlyFee: 0 },
        { validFrom: d("2026-07-01"), unitPrice: 20, monthlyFee: 0 },
      ],
      d("2026-01-01"),
      d("2026-12-31"),
    );
    expect(r).not.toBeNull();
    // Approximately half the year at each tariff
    expect(r!.segments).toHaveLength(2);
    expect(r!.unitCost).toBeGreaterThan(3650); // higher than flat-10 baseline
    expect(r!.unitCost).toBeLessThan(7300); // lower than flat-20
  });

  it("returns null when no tariffs exist, so the price is unknown, not 0 Kč", () => {
    expect(priceForPeriod(readings, [], d("2026-01-01"), d("2026-12-31"))).toBeNull();
  });
});

describe("monthlyConsumption", () => {
  it("breaks the period down by calendar months", () => {
    const readings = [
      { id: 1, date: d("2026-01-01"), value: 0 },
      { id: 2, date: d("2026-04-01"), value: 90 }, // 30/month linear
    ];
    const months = monthlyConsumption(readings, d("2026-01-01"), d("2026-03-31"));
    expect(months).toHaveLength(3);
    for (const m of months) {
      expect(m.consumption).toBeGreaterThan(20);
      expect(m.consumption).toBeLessThan(40);
    }
  });

  it("does not include the first month after an end-of-year boundary", () => {
    const readings = [
      { id: 1, date: d("2026-01-01"), value: 0 },
      { id: 2, date: d("2027-01-01"), value: 365 },
    ];
    const months = monthlyConsumption(readings, d("2026-01-01"), d("2027-01-01"));

    expect(months).toHaveLength(12);
    expect(months.at(-1)?.month.getMonth()).toBe(11);
  });

  it("returns each month's period clipped to the requested range", () => {
    const readings = [
      { id: 1, date: d("2026-01-01"), value: 0 },
      { id: 2, date: d("2026-04-01"), value: 90 },
    ];
    const months = monthlyConsumption(readings, d("2026-01-15"), d("2026-03-10"));
    expect(months[0].start).toEqual(d("2026-01-15"));
    expect(months[0].end).toEqual(new Date(2026, 1, 1));
    expect(months.at(-1)?.end).toEqual(new Date(2026, 2, 10));
  });
});
