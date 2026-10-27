import { describe, expect, it } from "vitest";
import { hashPassword, normalizeUsername, validPassword, verifyPassword } from "./password";

describe("local credentials", () => {
  it("normalizes usernames and rejects invalid credentials", () => {
    expect(normalizeUsername("  Honza_1 ")).toBe("honza_1");
    expect(normalizeUsername("a b")).toBeNull();
    expect(validPassword("short")).toBe(false);
  });

  it("stores a salted hash and verifies the password", async () => {
    const password = "a private password 123";
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).not.toBe(second);
    expect(first).not.toContain(password);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword("different password", first)).toBe(false);
    expect(await verifyPassword(password, "invalid")).toBe(false);
  });
});
