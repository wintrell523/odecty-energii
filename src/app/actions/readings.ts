"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { prisma } from "@/lib/db";
import { readingInput } from "@/lib/schemas";
import { parseIsoDate } from "@/lib/format";

export type ReadingActionResult =
  | { ok: true; id?: number }
  | { ok: false; errors: Record<string, string> };

function flattenErrors(zerr: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of zerr.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createReading(_prev: ReadingActionResult | null, formData: FormData): Promise<ReadingActionResult> {
  const parsed = readingInput.safeParse({
    meterId: formData.get("meterId"),
    date: formData.get("date"),
    value: formData.get("value"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };

  const reading = await prisma.reading.create({
    data: {
      meterId: parsed.data.meterId,
      date: parseIsoDate(parsed.data.date),
      value: parsed.data.value,
      note: parsed.data.note || null,
    },
  });
  revalidatePath("/readings");
  revalidatePath("/");
  revalidatePath("/reports");
  return { ok: true, id: reading.id };
}

export async function updateReading(id: number, _prev: ReadingActionResult | null, formData: FormData): Promise<ReadingActionResult> {
  const parsed = readingInput.safeParse({
    meterId: formData.get("meterId"),
    date: formData.get("date"),
    value: formData.get("value"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };

  await prisma.reading.update({
    where: { id },
    data: {
      meterId: parsed.data.meterId,
      date: parseIsoDate(parsed.data.date),
      value: parsed.data.value,
      note: parsed.data.note || null,
    },
  });
  revalidatePath("/readings");
  revalidatePath("/");
  revalidatePath("/reports");
  return { ok: true };
}

export async function deleteReading(id: number) {
  await prisma.reading.delete({ where: { id } });
  revalidatePath("/readings");
  revalidatePath("/");
  revalidatePath("/reports");
}
