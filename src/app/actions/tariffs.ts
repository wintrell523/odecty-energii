"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { tariffInput, zodErrors } from "@/lib/schemas";
import { parseIsoDate } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";

export type TariffActionResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

export async function createTariff(_prev: TariffActionResult | null, formData: FormData): Promise<TariffActionResult> {
  const user = await requireUser();
  const parsed = tariffInput.safeParse({
    meterId: formData.get("meterId"),
    validFrom: formData.get("validFrom"),
    unitPrice: formData.get("unitPrice"),
    monthlyFee: formData.get("monthlyFee") || "0",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const meter = await prisma.meter.findFirst({ where: { id: parsed.data.meterId, ownerId: user.id } });
  if (!meter) return { ok: false, errors: { meterId: "Měřič nebyl nalezen." } };

  await prisma.tariff.create({
    data: {
      meterId: parsed.data.meterId,
      validFrom: parseIsoDate(parsed.data.validFrom),
      unitPrice: parsed.data.unitPrice,
      monthlyFee: parsed.data.monthlyFee ?? 0,
      note: parsed.data.note || null,
    },
  });
  revalidatePath("/tariffs");
  revalidatePath("/reports");
  revalidatePath("/");
  return { ok: true };
}

export async function updateTariff(id: number, _prev: TariffActionResult | null, formData: FormData): Promise<TariffActionResult> {
  const user = await requireUser();
  const parsed = tariffInput.safeParse({
    meterId: formData.get("meterId"),
    validFrom: formData.get("validFrom"),
    unitPrice: formData.get("unitPrice"),
    monthlyFee: formData.get("monthlyFee") || "0",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const meter = await prisma.meter.findFirst({ where: { id: parsed.data.meterId, ownerId: user.id } });
  if (!meter) return { ok: false, errors: { meterId: "Měřič nebyl nalezen." } };

  const changed = await prisma.tariff.updateMany({
    where: { id, meter: { ownerId: user.id } },
    data: {
      meterId: parsed.data.meterId,
      validFrom: parseIsoDate(parsed.data.validFrom),
      unitPrice: parsed.data.unitPrice,
      monthlyFee: parsed.data.monthlyFee ?? 0,
      note: parsed.data.note || null,
    },
  });
  if (changed.count !== 1) notFound();
  revalidatePath("/tariffs");
  revalidatePath("/reports");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteTariff(id: number) {
  const user = await requireUser();
  const deleted = await prisma.tariff.deleteMany({ where: { id, meter: { ownerId: user.id } } });
  if (deleted.count !== 1) notFound();
  revalidatePath("/tariffs");
  revalidatePath("/reports");
  revalidatePath("/");
}
