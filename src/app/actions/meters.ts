"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { meterInput, zodErrors } from "@/lib/schemas";

export type MeterActionResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

export async function createMeter(_prev: MeterActionResult | null, formData: FormData): Promise<MeterActionResult> {
  const parsed = meterInput.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    unit: formData.get("unit"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  await prisma.meter.create({ data: parsed.data });
  revalidatePath("/meters");
  revalidatePath("/");
  return { ok: true };
}

export async function updateMeter(id: number, _prev: MeterActionResult | null, formData: FormData): Promise<MeterActionResult> {
  const parsed = meterInput.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    unit: formData.get("unit"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  await prisma.meter.update({ where: { id }, data: parsed.data });
  revalidatePath("/meters");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteMeter(id: number) {
  await prisma.meter.delete({ where: { id } });
  revalidatePath("/meters");
  revalidatePath("/");
}
