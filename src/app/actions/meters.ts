"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { meterInput, zodErrors } from "@/lib/schemas";
import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";

export type MeterActionResult =
  | { ok: true }
  | { ok: false; errors: Record<string, string> };

export async function createMeter(_prev: MeterActionResult | null, formData: FormData): Promise<MeterActionResult> {
  const user = await requireUser();
  const parsed = meterInput.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    unit: formData.get("unit"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  await prisma.meter.create({ data: { ...parsed.data, ownerId: user.id } });
  revalidatePath("/meters");
  revalidatePath("/");
  return { ok: true };
}

export async function updateMeter(id: number, _prev: MeterActionResult | null, formData: FormData): Promise<MeterActionResult> {
  const user = await requireUser();
  const parsed = meterInput.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    unit: formData.get("unit"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const changed = await prisma.meter.updateMany({ where: { id, ownerId: user.id }, data: parsed.data });
  if (changed.count !== 1) notFound();
  revalidatePath("/meters");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteMeter(id: number) {
  const user = await requireUser();
  const deleted = await prisma.meter.deleteMany({ where: { id, ownerId: user.id } });
  if (deleted.count !== 1) notFound();
  revalidatePath("/meters");
  revalidatePath("/");
}
