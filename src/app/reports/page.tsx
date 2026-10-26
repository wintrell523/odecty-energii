import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  formatNumber,
  formatPrice,
  meterTypeLabel,
  unitLabel,
  type MeterType,
  type Unit,
} from "@/lib/format";
import {
  consumptionBetween,
  monthlyConsumption,
  priceForPeriod,
  gjToKwh,
  type ReadingRow,
  type TariffRow,
} from "@/lib/calculations";
import { accentFor } from "@/lib/theme";
import ConsumptionChart from "@/components/ConsumptionChart";
import { parseYear } from "@/lib/years";

export const dynamic = "force-dynamic";

const MONTH_NAMES_SHORT = [
  "led", "úno", "bře", "dub", "kvě", "čvn",
  "čvc", "srp", "zář", "říj", "lis", "pro",
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = parseYear(yearParam) ?? currentYear;
  const from = new Date(year, 0, 1);
  const to = new Date(year + 1, 0, 1);

  const meters = await prisma.meter.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
    include: {
      readings: { orderBy: { date: "asc" } },
      tariffs: { orderBy: { validFrom: "asc" } },
    },
  });

  const allReadings = await prisma.reading.findMany({ select: { date: true } });
  const years = new Set<number>([year, currentYear]);
  for (const r of allReadings) years.add(r.date.getFullYear());
  const yearList = Array.from(years).sort((a, b) => b - a);

  const meterReports = meters.map((m) => {
    const readings: ReadingRow[] = m.readings.map((r) => ({
      id: r.id,
      date: r.date,
      value: Number(r.value),
    }));
    const tariffs: TariffRow[] = m.tariffs.map((t) => ({
      validFrom: t.validFrom,
      unitPrice: Number(t.unitPrice),
      monthlyFee: Number(t.monthlyFee),
    }));

    const monthly = monthlyConsumption(readings, from, to);
    const monthlyWithPrices = monthly.map((month) => {
      const monthEnd = new Date(
        month.month.getFullYear(),
        month.month.getMonth() + 1,
        1,
      );
      return {
        ...month,
        price: priceForPeriod(readings, tariffs, month.month, monthEnd)?.total ?? null,
      };
    });
    const consumption = consumptionBetween(readings, from, to);
    const total = priceForPeriod(readings, tariffs, from, to);

    return {
      id: m.id,
      name: m.name,
      type: m.type as MeterType,
      unit: m.unit as Unit,
      monthly: monthlyWithPrices,
      consumption,
      total,
    };
  });

  return (
    <div className="space-y-6">
      <header className="section-head">
        <div>
          <h1 className="display">
            <span>Souhrny</span>{" "}
            <span className="text-ink-muted display">{year}</span>
          </h1>
          <p className="section-sub">co se za rok napočítalo</p>
        </div>
        <Link
          href={`/api/export?year=${year}`}
          className="btn btn-secondary"
          prefetch={false}
        >
          ⬇ Export CSV
        </Link>
      </header>

      <nav className="flex gap-1.5 flex-wrap items-center" aria-label="Rok">
        {yearList.map((y) => (
          <Link
            key={y}
            href={`/reports?year=${y}`}
            className={`chip ${y === year ? "is-active" : ""} numerals`}
          >
            {y}
          </Link>
        ))}
      </nav>

      <div className="space-y-3">
        {meterReports.map((r) => {
          const accent = accentFor(r.type);
          return (
            <section
              key={r.id}
              className="card card-accent grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 lg:gap-8 items-stretch"
              style={{ "--accent": `var(${accent.cssVar})` } as React.CSSProperties}
            >
              {/* Totals sidebar */}
              <aside className="flex flex-col gap-4">
                <header>
                  <h2 className="display accent-text text-xl">{r.name}</h2>
                  <p className="text-xs accent-muted">
                    {meterTypeLabel(r.type)} · {unitLabel(r.unit)}
                  </p>
                </header>

                <div>
                  <p className="text-xs accent-muted mb-1">Roční spotřeba</p>
                  {r.consumption != null ? (
                    <>
                      <p className="display numerals text-3xl">
                        {formatNumber(r.consumption)}{" "}
                        <span className="text-sm font-medium">
                          {unitLabel(r.unit)}
                        </span>
                      </p>
                      {r.unit === "GJ" && (
                        <p className="text-xs accent-muted mt-1">
                          ≈ {formatNumber(gjToKwh(r.consumption))} kWh
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-ink-faint">—</p>
                  )}
                </div>

                <div>
                  <p className="text-xs accent-muted mb-1">Přibližná cena</p>
                  {r.total ? (
                    <>
                      <p className="display numerals text-2xl">
                        {formatPrice(r.total.total)}
                      </p>
                      <dl className="mt-2 text-xs numerals">
                        <div className="flex justify-between gap-3 border-t border-rule py-1">
                          <dt className="accent-muted">spotřeba</dt>
                          <dd>{formatPrice(r.total.unitCost)}</dd>
                        </div>
                        <div className="flex justify-between gap-3 border-t border-rule py-1">
                          <dt className="accent-muted">paušál</dt>
                          <dd>{formatPrice(r.total.feeCost)}</dd>
                        </div>
                      </dl>
                    </>
                  ) : (
                    <p className="text-ink-faint">—</p>
                  )}
                </div>
              </aside>

              {/* Chart */}
              <div className="min-h-[240px]">
                <ConsumptionChart
                  data={r.monthly.map((m) => ({
                    label: MONTH_NAMES_SHORT[m.month.getMonth()],
                    consumption: Number(m.consumption.toFixed(3)),
                    price: m.price == null ? null : Number(m.price.toFixed(2)),
                  }))}
                  unit={r.unit}
                  color={accent.hex}
                />
              </div>
            </section>
          );
        })}
        {meterReports.length === 0 && (
          <div className="card text-center py-10 text-ink-muted">
            Žádné aktivní měřiče.
          </div>
        )}
      </div>

      <p className="text-xs text-ink-muted max-w-2xl">
        Cena za rok respektuje historii sazeb. Pokud sazba pokrývá jen část
        roku, spotřeba se dělí lineárně podle dnů.
      </p>
    </div>
  );
}
