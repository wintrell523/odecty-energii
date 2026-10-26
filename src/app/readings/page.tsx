import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  formatDate,
  formatNumber,
  meterTypeIcon,
  unitLabel,
  type MeterType,
  type Unit,
} from "@/lib/format";
import { withConsumption, gjToKwh } from "@/lib/calculations";
import { accentFor } from "@/lib/theme";
import { deleteReading } from "@/app/actions/readings";
import DeleteButton from "@/components/DeleteButton";

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

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="section-head">
          <div className="space-y-1">
            <p className="smallcaps text-[0.68rem] text-ink-muted">
              historie odečtů
            </p>
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
        </div>
        <div className="rule-dashed" />
      </header>

      <nav className="flex gap-2 flex-wrap items-center">
        <span className="smallcaps text-[0.65rem] text-ink-muted mr-2">
          filtr měřiče
        </span>
        <Link href="/readings" className={`chip ${!meterId ? "is-active" : ""}`}>
          všechny
        </Link>
        {meters.map((m) => {
          const accent = accentFor(m.type as MeterType);
          const isActive = meterId === m.id;
          return (
            <Link
              key={m.id}
              href={`/readings?meter=${m.id}`}
              className={`chip ${isActive ? "is-active" : ""}`}
            >
              {!isActive && (
                <span
                  className="accent-dot"
                  style={{
                    ["--dot" as string]: `var(${accent.cssVar})`,
                    width: "0.45rem",
                    height: "0.45rem",
                  }}
                  aria-hidden="true"
                />
              )}
              {m.name}
            </Link>
          );
        })}
      </nav>

      <section className="card overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Měřič</th>
              <th className="text-right">Stav</th>
              <th className="text-right">Spotřeba od minulého</th>
              <th className="text-right">Dní</th>
              <th className="text-right">Ø denně</th>
              <th>Poznámka</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const accent = accentFor(r.meterType);
              return (
                <tr key={r.id}>
                  <td className="whitespace-nowrap text-ink-soft">
                    {formatDate(r.date)}
                  </td>
                  <td>
                    <span className="grid w-36 grid-cols-[0.45rem_minmax(0,1fr)_1rem] items-start gap-2">
                      <span
                        className="accent-dot mt-[0.4rem]"
                        style={{
                          ["--dot" as string]: `var(${accent.cssVar})`,
                          width: "0.45rem",
                          height: "0.45rem",
                        }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 text-ink">{r.meterName}</span>
                      <span
                        className="text-center text-ink-muted text-xs leading-5"
                        aria-hidden="true"
                      >
                        {meterTypeIcon(r.meterType)}
                      </span>
                    </span>
                  </td>
                  <td className="text-right numerals text-ink">
                    {formatNumber(r.value)}{" "}
                    <span className="text-ink-muted text-xs">
                      {unitLabel(r.unit)}
                    </span>
                  </td>
                  <td className="text-right numerals">
                    {r.consumption == null ? (
                      <span className="text-ink-faint">—</span>
                    ) : (
                      <>
                        <span className="text-ink">
                          {formatNumber(r.consumption)} {unitLabel(r.unit)}
                        </span>
                        {r.unit === "GJ" && (
                          <div className="text-xs text-ink-muted mt-0.5">
                            ≈ {formatNumber(gjToKwh(r.consumption))} kWh
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="text-right numerals text-ink-soft">
                    {r.days ?? <span className="text-ink-faint">—</span>}
                  </td>
                  <td className="text-right numerals text-ink-soft">
                    {r.dailyAvg == null ? (
                      <span className="text-ink-faint">—</span>
                    ) : (
                      `${formatNumber(r.dailyAvg)} ${unitLabel(r.unit)}`
                    )}
                  </td>
                  <td className="text-ink-soft text-sm">
                    {r.note ?? ""}
                  </td>
                  <td className="text-right">
                    <DeleteButton
                      action={async () => {
                        "use server";
                        await deleteReading(r.id);
                      }}
                      confirmText="Smazat odečet?"
                    />
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center text-ink-muted py-10"
                >
                  Zatím žádné odečty. Přidej první přes „+ Nový odečet&ldquo;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <p className="text-xs text-ink-muted max-w-2xl">
        Spotřeba se počítá jako rozdíl proti chronologicky předchozímu odečtu
        téhož měřiče. U tepla se navíc zobrazuje přepočet na kWh.
      </p>
    </div>
  );
}
