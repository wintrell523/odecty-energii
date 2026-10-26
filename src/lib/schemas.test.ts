import { describe, expect, it } from "vitest";
import { readingInput, tariffInput } from "./schemas";
import { parseYear } from "./years";

describe("date and year validation", () => {
  it("accepts real ISO calendar dates", () => {
    expect(readingInput.safeParse({ meterId: "1", date: "2026-02-28", value: "5" }).success).toBe(true);
    expect(tariffInput.safeParse({ meterId: "1", validFrom: "2024-02-29", unitPrice: "5" }).success).toBe(true);
  });

  it("rejects impossible dates before they reach Prisma", () => {
    expect(readingInput.safeParse({ meterId: "1", date: "2026-02-29", value: "5" }).success).toBe(false);
    expect(tariffInput.safeParse({ meterId: "1", validFrom: "not-a-date", unitPrice: "5" }).success).toBe(false);
  });

  it("only accepts supported four-digit years", () => {
    expect(parseYear("2026")).toBe(2026);
    expect(parseYear("1899")).toBeNull();
    expect(parseYear("2026.5")).toBeNull();
    expect(parseYear("abc")).toBeNull();
  });
});
