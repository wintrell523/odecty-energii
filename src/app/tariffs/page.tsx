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
import { deleteTariff } from "@/app/actions/tariffs";
import DeleteButton from "@/components/DeleteButton";

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
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="section-head">
          <div className="space-y-1">
            <p className="smallcaps text-[0.68rem] text-ink-muted">
              ceník
            </p>
            <h1 className="display">Sazby a ceny</h1>
            <p className="section-sub">
              historie tarifů — co kdy platilo, to se počítá
            </p>
          </div>
          <Link href="/tariffs/new" scroll={false} className="btn btn-primary">
            + Nová sazba
          </Link>
        </div>
        <div className="rule-dashed" />
      </header>

      <div className="space-y-5">
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
              <header className="flex items-baseline justify-between gap-3 mb-5 flex-wrap">
                <h3 className="display flex items-center gap-2.5" style={{ fontSize: "1.25rem", fontWeight: 500 }}>
                  <span
                    className="accent-dot"
                    style={{ ["--dot" as string]: `var(${accent.cssVar})` }}
                    aria-hidden="true"
                  />
                  {meter.name}
                </h3>
                <span className="text-xs text-ink-muted">
                  {meterTypeLabel(meter.type as MeterType)} ·{" "}
                  {unitLabel(meter.unit as Unit)}
                </span>
              </header>
              {tlist.length === 0 ? (
                <p className="text-sm text-ink-muted">
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
                            <DeleteButton
                              action={async () => {
                                "use server";
                                await deleteTariff(t.id);
                              }}
                              confirmText="Smazat sazbu?"
                            />
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
