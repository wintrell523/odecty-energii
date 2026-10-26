import { prisma } from "@/lib/db";
import { toMeterOption } from "@/lib/format";
import TariffForm from "@/components/TariffForm";

export default async function NewTariff() {
  const meters = await prisma.meter.findMany({
    where: { active: true },
    orderBy: { id: "asc" },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="display text-2xl">
          Nová sazba
        </h1>
        <p className="section-sub">platí od zadaného data dál</p>
      </header>

      <div>
        <TariffForm
          meters={meters.map(toMeterOption)}
        />
        <p className="text-xs text-ink-muted mt-5 pt-4 border-t border-rule">
          Sazba platí od zadaného data, dokud není zadána novější. Pro období
          před první sazbou se použije nejstarší.
        </p>
      </div>
    </div>
  );
}
