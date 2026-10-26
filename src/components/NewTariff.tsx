import { prisma } from "@/lib/db";
import type { MeterType, Unit } from "@/lib/format";
import TariffForm from "@/components/TariffForm";

export default async function NewTariff() {
  const meters = await prisma.meter.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
  });

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <header className="space-y-3 text-center">
        <h1 className="display" style={{ fontSize: "2.4rem" }}>
          Nová sazba
        </h1>
        <p className="section-sub">platí od zadaného data dál</p>
      </header>

      <div className="card" style={{ padding: "2rem 2.25rem" }}>
        <TariffForm
          meters={meters.map((m) => ({
            id: m.id,
            name: m.name,
            type: m.type as MeterType,
            unit: m.unit as Unit,
          }))}
        />
        <p className="text-xs text-ink-muted mt-5 pt-4 border-t border-rule-soft">
          Sazba platí od zadaného data, dokud není zadána novější. Pro období
          před první sazbou se použije nejstarší.
        </p>
      </div>
    </div>
  );
}
