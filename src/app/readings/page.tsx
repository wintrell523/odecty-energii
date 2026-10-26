import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  formatDateLong,
  formatNumber,
  toIsoDate,
  unitLabel,
  type MeterType,
  type Unit,
} from "@/lib/format";
import { withConsumption, gjToKwh } from "@/lib/calculations";
import { accentFor } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function ReadingsPage({
  searchParams,
}: {
  searchParams: Promise<{ meter?: string }>;
}) {
  const { meter } = await searchParams;
  const meterId = meter ? Number(meter) : undefined;

  const [meters, readings] = await Promise.all([
    prisma.meter.findMany({ orderBy: { id: "asc" } }),
    prisma.reading.findMany({
      where: meterId ? { meterId } : undefined,
      orderBy: [{ meterId: "asc" }, { date: "asc" }],
      include: { meter: true },
    }),
  ]);

  const byMeter = new Map<number, typeof readings>();
  for (const r of readings) {
    const arr = byMeter.get(r.meterId) ?? [];
    arr.push(r);
    byMeter.set(r.meterId, arr);
  }

  type Row = {
    id: number;
    meterId: number;
    meterName: string;
    meterType: MeterType;
    unit: Unit;
    date: Date;
    value: number;
    consumption: number | null;
    days: number | null;
    dailyAvg: number | null;
    note: string | null;
  };

  const rows: Row[] = [];
  for (const [mId, rs] of byMeter.entries()) {
    const m = rs[0].meter;
    const enriched = withConsumption(
      rs.map((r) => ({ id: r.id, date: r.date, value: Number(r.value) })),
    );
    for (let i = 0; i < enriched.length; i++) {
      const e = enriched[i];
      rows.push({
        id: e.id,
        meterId: mId,
        meterName: m.name,
        meterType: m.type as MeterType,
        unit: m.unit as Unit,
        date: e.date,
        value: e.value,
        consumption: e.consumption,
        days: e.days,
        dailyAvg: e.dailyAvg,
        note: rs[i].note,
      });
    }
  }

  rows.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Rows are sorted newest first, so each day's group stays in order.
  const days: { key: string; date: Date; rows: Row[] }[] = [];
  for (const r of rows) {
    const key = toIsoDate(r.date);
    if (days.at(-1)?.key !== key) days.push({ key, date: r.date, rows: [] });
    days.at(-1)!.rows.push(r);
  }

  return (
    <div className="space-y-6">
      <header className="section-head">
        <div>
          <h1 className="display">Odečty</h1>
          <p className="section-sub">
            {rows.length === 0
              ? "zatím nic"
              : `${rows.length} ${rows.length === 1 ? "záznam" : rows.length < 5 ? "záznamy" : "záznamů"}`}
          </p>
        </div>
        <Link href="/readings/new" scroll={false} className="btn btn-primary">
          + Nový odečet
        </Link>
      </header>

      <nav className="flex gap-1.5 flex-wrap items-center" aria-label="Filtr měřiče">
        <Link href="/readings" className={`chip ${!meterId ? "is-active" : ""}`}>
          Všechny
        </Link>
        {meters.map((m) => {
          const accent = accentFor(m.type as MeterType);
          const isActive = meterId === m.id;
          return (
            <Link
              key={m.id}
              href={`/readings?meter=${m.id}`}
              className={`chip ${isActive ? "is-active" : ""}`}
              style={{ "--accent": `var(${accent.cssVar})` } as React.CSSProperties}
            >
              {!isActive && <span className="meter-swatch" aria-hidden="true" />}
              {m.name}
            </Link>
          );
        })}
      </nav>

      {days.length === 0 ? (
        <p className="card text-center text-ink-muted">
          Zatím žádné odečty. Přidej první přes „+ Nový odečet&ldquo;.
        </p>
      ) : (
        <div className="space-y-5">
          {days.map((day) => (
            <section key={day.key}>
              <header className="flex items-baseline justify-between gap-3 px-1 pb-2">
                <h2 className="display text-base">{formatDateLong(day.date)}</h2>
                <span className="text-xs text-ink-muted">
                  {day.rows.length}{" "}
                  {day.rows.length === 1
                    ? "odečet"
                    : day.rows.length < 5
                      ? "odečty"
                      : "odečtů"}
                </span>
              </header>
              <ul className="divide-y divide-rule rounded-2xl bg-surface">
                {day.rows.map((r) => (
                  <li
                    key={r.id}
                    className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 px-4 py-3 text-sm sm:grid-cols-[8.5rem_8rem_1fr_auto]"
                    style={
                      {
                        "--accent": `var(${accentFor(r.meterType).cssVar})`,
                      } as React.CSSProperties
                    }
                  >
                    <span>
                      <span className="meter-pill">{r.meterName}</span>
                    </span>
                    <span className="numerals text-right sm:text-left">
                      {formatNumber(r.value)} {unitLabel(r.unit)}
                    </span>
                    <span className="text-ink-muted numerals">
                      {r.consumption == null ? (
                        "první odečet"
                      ) : (
                        <>
                          <span className="accent-text font-semibold">
                            +{formatNumber(r.consumption)} {unitLabel(r.unit)}
                          </span>
                          {r.unit === "GJ" &&
                            ` ≈ ${formatNumber(gjToKwh(r.consumption))} kWh`}
                          {r.days != null &&
                            ` · ${r.days} ${r.days === 1 ? "den" : r.days < 5 ? "dny" : "dní"}`}
                          {r.dailyAvg != null &&
                            ` · ${formatNumber(r.dailyAvg)} ${unitLabel(r.unit)}/den`}
                        </>
                      )}
                      {r.note && <span className="text-ink-soft"> · {r.note}</span>}
                    </span>
                    <Link
                      href={`/readings/${r.id}/edit`}
                      scroll={false}
                      className="text-right text-ink-muted hover:text-ink transition-colors"
                    >
                      Upravit
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-muted max-w-2xl">
        Spotřeba se počítá jako rozdíl proti chronologicky předchozímu odečtu
        téhož měřiče. U tepla se navíc zobrazuje přepočet na kWh.
      </p>
    </div>
  );
}
