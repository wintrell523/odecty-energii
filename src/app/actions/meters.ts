"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { meterInput } from "@/lib/schemas";

export type MeterActionResult =
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

export async function createMeter(_prev: MeterActionResult | null, formData: FormData): Promise<MeterActionResult> {
  const parsed = meterInput.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    unit: formData.get("unit"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };
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
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };
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
