import { describe, expect, it } from "vitest";
import { escapeCsvCell, escapeCsvText } from "./csv";

describe("CSV values", () => {
  it("marks formula-leading text as text for spreadsheet apps", () => {
    expect(escapeCsvText("=1+1")).toBe("'=1+1");
    expect(escapeCsvText("  @SUM(A1:A2)")).toBe("'  @SUM(A1:A2)");
    expect(escapeCsvText("Měřič")).toBe("Měřič");
    expect(escapeCsvText(null)).toBe("");
  });

  it("quotes separators and doubles quotes", () => {
    expect(escapeCsvCell('meter;"one"')).toBe('"meter;""one"""');
  });
});
