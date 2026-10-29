"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { readingInput, zodErrors } from "@/lib/schemas";
import { parseIsoDate } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";

export type ReadingActionResult =
  | { ok: true; id?: number }
  | { ok: false; errors: Record<string, string> };

// shortcut: concurrent submissions and legacy duplicates can bypass this check; resolve duplicates before adding a unique index.
async function hasReadingOnDate(meterId: number, date: Date, exceptId?: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  return prisma.reading.findFirst({
    where: {
      meterId,
      date: { gte: date, lt: nextDate },
      ...(exceptId === undefined ? {} : { NOT: { id: exceptId } }),
    },
    select: { id: true },
  });
}

export async function createReading(_prev: ReadingActionResult | null, formData: FormData): Promise<ReadingActionResult> {
  const user = await requireUser();
  const parsed = readingInput.safeParse({
    meterId: formData.get("meterId"),
    date: formData.get("date"),
    value: formData.get("value"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const meter = await prisma.meter.findFirst({ where: { id: parsed.data.meterId, ownerId: user.id } });
  if (!meter) return { ok: false, errors: { meterId: "Měřič nebyl nalezen." } };
  const date = parseIsoDate(parsed.data.date);
  if (await hasReadingOnDate(parsed.data.meterId, date)) {
    return { ok: false, errors: { date: "Pro tento měřič už odečet v tento den existuje." } };
  }

  const reading = await prisma.reading.create({
    data: {
      meterId: parsed.data.meterId,
      date,
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
  const user = await requireUser();
  const parsed = readingInput.safeParse({
    meterId: formData.get("meterId"),
    date: formData.get("date"),
    value: formData.get("value"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const meter = await prisma.meter.findFirst({ where: { id: parsed.data.meterId, ownerId: user.id } });
  if (!meter) return { ok: false, errors: { meterId: "Měřič nebyl nalezen." } };
  const date = parseIsoDate(parsed.data.date);
  if (await hasReadingOnDate(parsed.data.meterId, date, id)) {
    return { ok: false, errors: { date: "Pro tento měřič už odečet v tento den existuje." } };
  }

  const changed = await prisma.reading.updateMany({
    where: { id, meter: { ownerId: user.id } },
    data: {
      meterId: parsed.data.meterId,
      date,
      value: parsed.data.value,
      note: parsed.data.note || null,
    },
  });
  if (changed.count !== 1) notFound();
  revalidatePath("/readings");
  revalidatePath("/");
  revalidatePath("/reports");
  return { ok: true };
}

export async function deleteReading(id: number) {
  const user = await requireUser();
  const deleted = await prisma.reading.deleteMany({ where: { id, meter: { ownerId: user.id } } });
  if (deleted.count !== 1) notFound();
  revalidatePath("/readings");
  revalidatePath("/");
  revalidatePath("/reports");
}
