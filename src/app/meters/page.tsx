import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  meterTypeLabel,
  unitLabel,
  type MeterType,
  type Unit,
} from "@/lib/format";
import { accentFor } from "@/lib/theme";
import { deleteMeter } from "@/app/actions/meters";
import DeleteButton from "@/components/DeleteButton";

export const dynamic = "force-dynamic";

export default async function MetersPage() {
  const meters = await prisma.meter.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { readings: true, tariffs: true } } },
  });

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="section-head">
          <div className="space-y-1">
            <p className="smallcaps text-[0.68rem] text-ink-muted">
              evidence
            </p>
            <h1 className="display">Měřiče</h1>
            <p className="section-sub">
              elektřina, voda, teplo · co měříš, to počítáš
            </p>
          </div>
          <Link href="/meters/new" scroll={false} className="btn btn-primary">
            + Nový měřič
          </Link>
        </div>
        <div className="rule-dashed" />
      </header>

      <section className="card overflow-x-auto">
        <table className="data">
          <thead>
            <tr>
              <th>Měřič</th>
              <th>Typ</th>
              <th>Jednotka</th>
              <th>Stav</th>
              <th className="text-right">Odečtů</th>
              <th className="text-right">Sazeb</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {meters.map((m) => {
              const accent = accentFor(m.type as MeterType);
              return (
                <tr key={m.id}>
                  <td>
                    <span className="flex items-center gap-2.5">
                      <span
                        className="accent-dot"
                        style={{ ["--dot" as string]: `var(${accent.cssVar})` }}
                        aria-hidden="true"
                      />
                      <span className="text-ink font-medium">{m.name}</span>
                    </span>
                  </td>
                  <td className="text-ink-soft">
                    {meterTypeLabel(m.type as MeterType)}
                  </td>
                  <td className="numerals text-ink-soft">
                    {unitLabel(m.unit as Unit)}
                  </td>
                  <td>
                    {m.active ? (
                      <span className="smallcaps text-[0.65rem] text-cold">
                        aktivní
                      </span>
                    ) : (
                      <span className="smallcaps text-[0.65rem] text-ink-faint">
                        neaktivní
                      </span>
                    )}
                  </td>
                  <td className="text-right numerals text-ink">
                    {m._count.readings}
                  </td>
                  <td className="text-right numerals text-ink">
                    {m._count.tariffs}
                  </td>
                  <td className="text-right">
                    <DeleteButton
                      action={async () => {
                        "use server";
                        await deleteMeter(m.id);
                      }}
                      confirmText={`Smazat měřič "${m.name}" a všechny jeho odečty a sazby?`}
                    />
                  </td>
                </tr>
              );
            })}
            {meters.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-muted py-8">
                  Žádné měřiče. Přidej první tlačítkem Nový měřič.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
