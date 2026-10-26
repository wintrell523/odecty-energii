import Link from "next/link";
import { prisma } from "@/lib/db";
import type { MeterType, Unit } from "@/lib/format";
import ReadingForm from "@/components/ReadingForm";

export default async function NewReading({
  searchParams,
}: {
  searchParams: Promise<{ meter?: string }>;
}) {
  const { meter } = await searchParams;
  const meters = await prisma.meter.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
  });

  if (meters.length === 0) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card text-center space-y-3 py-10">
          <p className="display" style={{ fontSize: "1.4rem", fontWeight: 500 }}>
            Žádné měřiče
          </p>
          <p className="text-ink-soft">
            Nejdřív si přidej měřič na stránce{" "}
            <Link href="/meters" className="ink-link">
              Měřiče
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  const defaultMeterId = meter ? Number(meter) : undefined;

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <header className="space-y-3 text-center">
        <p className="smallcaps text-[0.68rem] text-ink-muted">
          nová poznámka do deníku
        </p>
        <h1 className="display" style={{ fontSize: "2.4rem" }}>
          Nový odečet
        </h1>
        <p className="section-sub">opiš číslo, které ti svítí na měřiči</p>
      </header>

      <div className="card" style={{ padding: "2rem 2.25rem" }}>
        <ReadingForm
          meters={meters.map((m) => ({
            id: m.id,
            name: m.name,
            type: m.type as MeterType,
            unit: m.unit as Unit,
          }))}
          defaultMeterId={defaultMeterId}
        />
      </div>
    </div>
  );
}
