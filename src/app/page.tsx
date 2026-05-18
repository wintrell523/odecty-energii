import Link from "next/link";
import { prisma } from "@/lib/db";
import MeterCard from "@/components/MeterCard";
import {
  priceForPeriod,
  type ReadingRow,
  type TariffRow,
} from "@/lib/calculations";
import type { MeterType, Unit } from "@/lib/format";

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

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="section-head">
          <div className="space-y-1">
            <p className="smallcaps text-[0.68rem] text-ink-muted">
              aktuální období
            </p>
            <h1 className="display">Přehled</h1>
            <p className="section-sub">{monthLabel}</p>
          </div>
          <div className="flex gap-2.5 items-center">
            <Link href="/reports" className="btn btn-secondary">
              Souhrny
            </Link>
            <Link href="/readings/new" className="btn btn-primary">
              + Nový odečet
            </Link>
          </div>
        </div>
        <div className="rule-dashed" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((c, i) => (
            <div
              key={c.id}
              className="stagger-in"
              style={{ ["--i" as string]: i }}
            >
              <MeterCard
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
