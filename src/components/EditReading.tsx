import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import type { MeterType, Unit } from "@/lib/format";
import ReadingForm from "@/components/ReadingForm";

export default async function EditReading({
  params,
  closeOnSuccess = false,
}: {
  params: Promise<{ id: string }>;
  closeOnSuccess?: boolean;
}) {
  const { id } = await params;
  const [reading, meters] = await Promise.all([
    prisma.reading.findUnique({ where: { id: Number(id) } }),
    prisma.meter.findMany({ orderBy: { id: "asc" } }),
  ]);
  if (!reading) notFound();

  return (
    <div className="space-y-8 max-w-xl mx-auto">
      <header className="space-y-3 text-center">
        <h1 className="display" style={{ fontSize: "2.4rem" }}>
          Upravit odečet
        </h1>
      </header>

      <div className="card" style={{ padding: "2rem 2.25rem" }}>
        <ReadingForm
          meters={meters.map((m) => ({
            id: m.id,
            name: m.name,
            type: m.type as MeterType,
            unit: m.unit as Unit,
          }))}
          initial={{
            id: reading.id,
            meterId: reading.meterId,
            date: reading.date,
            value: Number(reading.value),
            note: reading.note,
          }}
          redirectTo={closeOnSuccess ? undefined : "/readings"}
          closeOnSuccess={closeOnSuccess}
        />
      </div>
    </div>
  );
}
