import { notFound, redirect, RedirectType } from "next/navigation";
import { prisma } from "@/lib/db";
import { toMeterOption } from "@/lib/format";
import TariffForm from "@/components/TariffForm";
import DeleteButton from "@/components/DeleteButton";
import { deleteTariff } from "@/app/actions/tariffs";

export default async function EditTariff({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [tariff, meters] = await Promise.all([
    prisma.tariff.findUnique({ where: { id } }),
    prisma.meter.findMany({ orderBy: { id: "asc" } }),
  ]);
  if (!tariff) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="display text-2xl">Upravit sazbu</h1>
      </header>

      <div>
        <TariffForm
          meters={meters.map(toMeterOption)}
          initial={{
            id: tariff.id,
            meterId: tariff.meterId,
            validFrom: tariff.validFrom,
            unitPrice: Number(tariff.unitPrice),
            monthlyFee: Number(tariff.monthlyFee),
            note: tariff.note,
          }}
        />
        <div className="mt-6 flex justify-end border-t border-rule pt-4">
          <DeleteButton
            action={async () => {
              "use server";
              await deleteTariff(tariff.id);
              // Leave the edit route, so it does not re-render a deleted tariff.
              redirect("/tariffs", RedirectType.replace);
            }}
            confirmText="Smazat sazbu?"
          />
        </div>
      </div>
    </div>
  );
}
