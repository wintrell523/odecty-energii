"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { tariffInput } from "@/lib/schemas";
import { parseIsoDate } from "@/lib/format";

export type TariffActionResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

function flattenErrors(zerr: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of zerr.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createTariff(_prev: TariffActionResult | null, formData: FormData): Promise<TariffActionResult> {
  const parsed = tariffInput.safeParse({
    meterId: formData.get("meterId"),
    validFrom: formData.get("validFrom"),
    unitPrice: formData.get("unitPrice"),
    monthlyFee: formData.get("monthlyFee") || "0",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };

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
