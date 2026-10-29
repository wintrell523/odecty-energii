import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  meterFindFirst: vi.fn(),
  readingFindFirst: vi.fn(),
  readingCreate: vi.fn(),
  readingUpdateMany: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    meter: { findFirst: mocks.meterFindFirst },
    reading: {
      findFirst: mocks.readingFindFirst,
      create: mocks.readingCreate,
      updateMany: mocks.readingUpdateMany,
    },
  },
}));
vi.mock("@/lib/auth", () => ({ requireUser: vi.fn(async () => ({ id: 1 })) }));
vi.mock("@/lib/schemas", () => ({
  readingInput: {
    safeParse: (input: { date: string }) => ({
      success: true,
      data: { meterId: 7, date: input.date, value: 123, note: "" },
    }),
  },
  zodErrors: vi.fn(),
}));
vi.mock("@/lib/format", () => ({
  parseIsoDate: (value: string) => new Date(`${value}T00:00:00`),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { createReading, updateReading } from "./readings";

function formData() {
  const data = new FormData();
  data.set("meterId", "7");
  data.set("date", "2026-01-01");
  data.set("value", "123");
  return data;
}

describe("reading date uniqueness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.meterFindFirst.mockResolvedValue({ id: 7 });
  });

  it("rejects a second reading for the same meter and date", async () => {
    mocks.readingFindFirst.mockResolvedValue({ id: 99 });

    const result = await createReading(null, formData());

    expect(result).toEqual({
      ok: false,
      errors: { date: "Pro tento měřič už odečet v tento den existuje." },
    });
    const range = mocks.readingFindFirst.mock.calls[0][0].where.date;
    const nextDate = new Date(range.gte);
    nextDate.setDate(nextDate.getDate() + 1);
    expect(range.lt).toEqual(nextDate);
    expect(mocks.readingCreate).not.toHaveBeenCalled();
  });

  it("allows editing the existing reading without treating it as a duplicate", async () => {
    mocks.readingFindFirst.mockResolvedValue(null);
    mocks.readingUpdateMany.mockResolvedValue({ count: 1 });

    const result = await updateReading(42, null, formData());

    expect(result).toEqual({ ok: true });
    expect(mocks.readingFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ NOT: { id: 42 } }),
    }));
    expect(mocks.readingUpdateMany).toHaveBeenCalledOnce();
  });
});
