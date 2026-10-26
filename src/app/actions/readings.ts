"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { readingInput, zodErrors } from "@/lib/schemas";
import { parseIsoDate } from "@/lib/format";

export type ReadingActionResult =
  | { ok: true; id?: number }
  | { ok: false; errors: Record<string, string> };

export async function createReading(_prev: ReadingActionResult | null, formData: FormData): Promise<ReadingActionResult> {
  const parsed = readingInput.safeParse({
    meterId: formData.get("meterId"),
    date: formData.get("date"),
    value: formData.get("value"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };

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
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };

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
