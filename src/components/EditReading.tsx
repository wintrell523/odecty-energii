import { notFound, redirect, RedirectType } from "next/navigation";
import { prisma } from "@/lib/db";
import { toMeterOption } from "@/lib/format";
import ReadingForm from "@/components/ReadingForm";
import DeleteButton from "@/components/DeleteButton";
import { deleteReading } from "@/app/actions/readings";
import { readingsListUrl } from "@/lib/filters";
import { requireUser } from "@/lib/auth";

export default async function EditReading({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ meter?: string }>;
}) {
  const user = await requireUser();
  const id = Number((await params).id);
  const listUrl = readingsListUrl((await searchParams).meter);
  if (!Number.isInteger(id)) notFound();
  const [reading, meters] = await Promise.all([
    prisma.reading.findFirst({ where: { id, meter: { ownerId: user.id } } }),
    prisma.meter.findMany({ where: { ownerId: user.id }, orderBy: { id: "asc" } }),
  ]);
  if (!reading) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="display text-2xl">
          Upravit odečet
        </h1>
      </header>

      <div>
        <ReadingForm
          meters={meters.map(toMeterOption)}
          initial={{
            id: reading.id,
            meterId: reading.meterId,
            date: reading.date,
            value: Number(reading.value),
            note: reading.note,
          }}
        />
        <div className="mt-6 flex justify-end border-t border-rule pt-4">
          <DeleteButton
            action={async () => {
              "use server";
              await deleteReading(reading.id);
              // Leave the edit route, so it does not re-render a deleted reading.
              redirect(listUrl, RedirectType.replace);
            }}
            confirmText="Smazat odečet?"
          />
        </div>
      </div>
    </div>
  );
}
