"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { tariffInput, zodErrors } from "@/lib/schemas";
import { parseIsoDate } from "@/lib/format";

export type TariffActionResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

export async function createTariff(_prev: TariffActionResult | null, formData: FormData): Promise<TariffActionResult> {
  const parsed = tariffInput.safeParse({
    meterId: formData.get("meterId"),
    validFrom: formData.get("validFrom"),
    unitPrice: formData.get("unitPrice"),
    monthlyFee: formData.get("monthlyFee") || "0",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };

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

export async function deleteTariff(id: number) {
  await prisma.tariff.delete({ where: { id } });
  revalidatePath("/tariffs");
  revalidatePath("/reports");
  revalidatePath("/");
}
