import { describe, expect, it } from "vitest";
import { readingsListUrl } from "./filters";

describe("readingsListUrl", () => {
  it("keeps a numeric meter filter", () => {
    expect(readingsListUrl("3")).toBe("/readings?meter=3");
  });

  it("drops a missing or invalid filter", () => {
    expect(readingsListUrl(undefined)).toBe("/readings");
    expect(readingsListUrl("")).toBe("/readings");
    expect(readingsListUrl("abc")).toBe("/readings");
    expect(readingsListUrl("3&x=1")).toBe("/readings");
  });
});
