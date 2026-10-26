import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  formatDate,
  formatNumber,
  formatPrice,
  meterTypeLabel,
  unitLabel,
  type MeterType,
  type Unit,
} from "@/lib/format";
import { accentFor } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function TariffsPage() {
  const [meters, tariffs] = await Promise.all([
    prisma.meter.findMany({ where: { active: true }, orderBy: { id: "asc" } }),
    prisma.tariff.findMany({
      orderBy: [{ meterId: "asc" }, { validFrom: "desc" }],
      include: { meter: true },
    }),
  ]);

  const byMeter = new Map<number, typeof tariffs>();
  for (const t of tariffs) {
    const arr = byMeter.get(t.meterId) ?? [];
    arr.push(t);
    byMeter.set(t.meterId, arr);
  }

  return (
    <div className="space-y-6">
      <header className="section-head">
        <div>
          <h1 className="display">Sazby a ceny</h1>
          <p className="section-sub">
            historie tarifů — co kdy platilo, to se počítá
          </p>
        </div>
        <Link href="/tariffs/new" scroll={false} className="btn btn-primary">
          + Nová sazba
        </Link>
      </header>

      <div className="space-y-3">
        {meters.map((meter) => {
          const tlist = byMeter.get(meter.id) ?? [];
          const accent = accentFor(meter.type as MeterType);
          return (
            <section
              key={meter.id}
              className="card card-accent"
              style={
                {
                  "--accent": `var(${accent.cssVar})`,
                } as React.CSSProperties
              }
            >
              <header className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                <h2 className="display accent-text text-xl">{meter.name}</h2>
                <span className="text-xs accent-muted">
                  {meterTypeLabel(meter.type as MeterType)} ·{" "}
                  {unitLabel(meter.unit as Unit)}
                </span>
              </header>
              {tlist.length === 0 ? (
                <p className="text-sm accent-muted">
                  Žádné sazby. Bez sazby se nepočítá cena.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Platnost od</th>
                        <th className="text-right">
                          Cena / {unitLabel(meter.unit as Unit)}
                        </th>
                        <th className="text-right">Paušál / měs.</th>
                        <th>Poznámka</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {tlist.map((t) => (
                        <tr key={t.id}>
                          <td className="text-ink-soft whitespace-nowrap">
                            {formatDate(t.validFrom)}
                          </td>
                          <td className="text-right numerals text-ink">
                            {formatPrice(Number(t.unitPrice))}
                          </td>
                          <td className="text-right numerals text-ink-soft">
                            {formatNumber(Number(t.monthlyFee))} Kč
                          </td>
                          <td className="text-ink-soft text-sm">
                            {t.note ?? (
                              <span className="text-ink-faint">—</span>
                            )}
                          </td>
                          <td className="text-right">
                            <Link
                              href={`/tariffs/${t.id}/edit`}
                              scroll={false}
                              className="text-ink-muted hover:text-ink transition-colors"
                            >
                              Upravit
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
