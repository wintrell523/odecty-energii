import Link from "next/link";
import { prisma } from "@/lib/db";
import MeterCard from "@/components/MeterCard";
import {
  priceForPeriod,
  type ReadingRow,
  type TariffRow,
} from "@/lib/calculations";
import { formatPrice, type MeterType, type Unit } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const meters = await prisma.meter.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
    include: {
      readings: { orderBy: { date: "asc" } },
      tariffs: { orderBy: { validFrom: "asc" } },
    },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const cards = meters.map((m) => {
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

    const last = readings.length > 0 ? readings[readings.length - 1] : null;
    const prev = readings.length > 1 ? readings[readings.length - 2] : null;

    const priceBreakdown = priceForPeriod(readings, tariffs, monthStart, monthEnd);

    return {
      id: m.id,
      name: m.name,
      type: m.type as MeterType,
      unit: m.unit as Unit,
      latest: last ? { date: last.date, value: last.value } : null,
      previous: prev ? { date: prev.date, value: prev.value } : null,
      monthConsumption: priceBreakdown?.consumption ?? null,
      monthPrice: priceBreakdown ? priceBreakdown.total : null,
    };
  });

  const monthLabel = now.toLocaleDateString("cs-CZ", {
    month: "long",
    year: "numeric",
  });

  const pricedCards = cards.filter((c) => c.monthPrice != null);
  const monthTotal = pricedCards.reduce((sum, c) => sum + c.monthPrice!, 0);

  return (
    <div className="space-y-6">
      <header className="section-head">
        <div>
          <h1 className="display">Přehled</h1>
          <p className="section-sub first-letter:uppercase">{monthLabel}</p>
        </div>
        <Link href="/readings/new" scroll={false} className="btn btn-primary">
          + Nový odečet
        </Link>
      </header>

      {meters.length === 0 ? (
        <div className="card">
          <p className="text-ink-soft">
            Žádné aktivní měřiče. Přidej je na{" "}
            <Link href="/meters" className="ink-link">
              Měřiče
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[1fr_15rem] lg:items-start">
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((c) => (
              <MeterCard
                key={c.id}
                meter={{
                  id: c.id,
                  name: c.name,
                  type: c.type,
                  unit: c.unit,
                }}
                latest={c.latest}
                previous={c.previous}
                monthConsumption={c.monthConsumption}
                monthPrice={c.monthPrice}
              />
            ))}
          </div>

          <section className="card" style={{ padding: "1rem 1.1rem" }}>
            <h2 className="section-sub">Tento měsíc celkem</h2>
            {pricedCards.length === 0 ? (
              <p className="mt-2 text-sm text-ink-muted">
                Bez sazeb se cena nepočítá.
              </p>
            ) : (
              <>
                <p className="display numerals mt-1.5 mb-3 text-3xl">
                  {formatPrice(monthTotal)}
                </p>
                <ul className="text-sm">
                  {pricedCards.map((c) => (
                    <li
                      key={c.id}
                      className="flex justify-between gap-3 border-t border-rule py-1.5"
                    >
                      <span className="text-ink-muted truncate">{c.name}</span>
                      <span className="numerals">{formatPrice(c.monthPrice!)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
