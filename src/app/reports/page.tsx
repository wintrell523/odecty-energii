import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  formatNumber,
  formatPrice,
  meterTypeIcon,
  meterTypeLabel,
  unitLabel,
  type MeterType,
  type Unit,
} from "@/lib/format";
import {
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
    const total = priceForPeriod(readings, tariffs, from, to);

    return {
      id: m.id,
      name: m.name,
      type: m.type as MeterType,
      unit: m.unit as Unit,
      monthly: monthlyWithPrices,
      total,
    };
  });

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="section-head">
          <div className="space-y-1">
            <p className="smallcaps text-[0.68rem] text-ink-muted">
              roční souhrn
            </p>
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
        </div>
        <div className="rule-dashed" />
      </header>

      <nav className="flex gap-2 flex-wrap items-center">
        <span className="smallcaps text-[0.65rem] text-ink-muted mr-2">
          rok
        </span>
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

      <div className="space-y-8">
        {meterReports.map((r, i) => {
          const accent = accentFor(r.type);
          return (
            <section
              key={r.id}
              className="stagger-in"
              style={{ ["--i" as string]: i }}
            >
              <div className="flex items-baseline gap-3 mb-4 flex-wrap">
                <span
                  className="accent-dot"
                  style={{ ["--dot" as string]: `var(${accent.cssVar})` }}
                  aria-hidden="true"
                />
                <h2
                  className="display"
                  style={{ fontSize: "1.6rem", fontWeight: 500 }}
                >
                  {r.name}
                </h2>
                <span className="section-sub">
                  {meterTypeIcon(r.type)} {meterTypeLabel(r.type)} ·{" "}
                  {unitLabel(r.unit)}
                </span>
              </div>

              <div
                className="card card-accent grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 lg:gap-8 items-stretch"
                style={
                  {
                    "--accent": `var(${accent.cssVar})`,
                  } as React.CSSProperties
                }
              >
                {/* Totals sidebar */}
                <aside className="flex flex-col gap-5 lg:border-r lg:border-rule lg:pr-8">
                  <div>
                    <p className="smallcaps text-[0.65rem] text-ink-muted mb-1.5">
                      roční spotřeba
                    </p>
                    {r.total ? (
                      <>
                        <p className="flex items-baseline gap-2 flex-wrap">
                          <span
                            className="display numerals text-ink"
                            style={{
                              fontSize: "clamp(2rem, 4vw, 2.6rem)",
                              fontWeight: 500,
                              lineHeight: 0.95,
                              fontVariationSettings:
                                '"SOFT" 30, "opsz" 144',
                            }}
                          >
                            {formatNumber(r.total.consumption)}
                          </span>
                          <span
                            className="text-ink-soft"
                            style={{ fontSize: "0.95rem" }}
                          >
                            {unitLabel(r.unit)}
                          </span>
                        </p>
                        {r.unit === "GJ" && (
                          <p className="text-xs text-ink-muted mt-1.5">
                            ≈ {formatNumber(gjToKwh(r.total.consumption))} kWh
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-ink-faint">—</p>
                    )}
                  </div>

                  <div className="rule-dashed" />

                  <div>
                    <p className="smallcaps text-[0.65rem] text-ink-muted mb-1.5">
                      přibližná cena
                    </p>
                    {r.total ? (
                      <>
                        <p
                          className="display numerals text-ink"
                          style={{
                            fontSize: "clamp(1.6rem, 3vw, 2rem)",
                            fontWeight: 500,
                            lineHeight: 1,
                            fontVariationSettings: '"SOFT" 40, "opsz" 96',
                          }}
                        >
                          {formatPrice(r.total.total)}
                        </p>
                        <div className="mt-3 space-y-1">
                          <div className="leader">
                            <span className="text-xs text-ink-muted">
                              spotřeba
                            </span>
                            <span className="leader-fill" aria-hidden="true" />
                            <span className="text-xs numerals text-ink-soft">
                              {formatPrice(r.total.unitCost)}
                            </span>
                          </div>
                          <div className="leader">
                            <span className="text-xs text-ink-muted">
                              paušál
                            </span>
                            <span className="leader-fill" aria-hidden="true" />
                            <span className="text-xs numerals text-ink-soft">
                              {formatPrice(r.total.feeCost)}
                            </span>
                          </div>
                        </div>
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
