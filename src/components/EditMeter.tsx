import { notFound, redirect, RedirectType } from "next/navigation";
import { prisma } from "@/lib/db";
import type { MeterType, Unit } from "@/lib/format";
import MeterForm from "@/components/MeterForm";
import DeleteButton from "@/components/DeleteButton";
import { deleteMeter } from "@/app/actions/meters";

export default async function EditMeter({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meter = await prisma.meter.findUnique({ where: { id: Number(id) } });
  if (!meter) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="display text-2xl">Upravit měřič</h1>
      </header>

      <div>
        <MeterForm
          initial={{
            id: meter.id,
            name: meter.name,
            type: meter.type as MeterType,
            unit: meter.unit as Unit,
            active: meter.active,
          }}
        />
        <div className="mt-6 flex justify-end border-t border-rule pt-4">
          <DeleteButton
            action={async () => {
              "use server";
              await deleteMeter(meter.id);
              // Leave the edit route, so it does not re-render a deleted meter.
              redirect("/meters", RedirectType.replace);
            }}
            confirmText={`Smazat měřič "${meter.name}" a všechny jeho odečty a sazby?`}
          />
        </div>
      </div>
    </div>
  );
}
