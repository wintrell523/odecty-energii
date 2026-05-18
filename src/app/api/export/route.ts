import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withConsumption } from "@/lib/calculations";
import { formatDate, unitLabel, meterTypeLabel, type MeterType, type Unit } from "@/lib/format";

function csvEscape(v: string | number | null): string {
  if (v == null) return "";
  const s = String(v);
  if (/[";\n,]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvNumber(n: number | null, decimals = 3): string {
  if (n == null) return "";
  return n.toFixed(decimals).replace(".", ",");
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const yearParam = url.searchParams.get("year");
  const year = yearParam ? Number(yearParam) : null;

  const where = year
    ? { date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } }
    : undefined;

  const readings = await prisma.reading.findMany({
    where,
    orderBy: [{ meterId: "asc" }, { date: "asc" }],
    include: { meter: true },
  });

  // We need previous reading for consumption — fetch all per meter and filter for display
  const byMeter = new Map<number, typeof readings>();
  for (const r of readings) {
    const arr = byMeter.get(r.meterId) ?? [];
    arr.push(r);
    byMeter.set(r.meterId, arr);
  }

  const rows: string[][] = [
    ["Datum", "Měřič", "Typ", "Stav", "Jednotka", "Spotřeba od minulého", "Dní", "Poznámka"],
  ];

  for (const [, rs] of byMeter) {
    const m = rs[0].meter;
    const enriched = withConsumption(
      rs.map((r) => ({ id: r.id, date: r.date, value: Number(r.value) })),
    );
    for (let i = 0; i < enriched.length; i++) {
      const e = enriched[i];
      rows.push([
        formatDate(e.date),
        m.name,
        meterTypeLabel(m.type as MeterType),
        csvNumber(e.value),
        unitLabel(m.unit as Unit),
        csvNumber(e.consumption),
        e.days != null ? String(e.days) : "",
        rs[i].note ?? "",
      ]);
    }
  }

  const csv = rows.map((r) => r.map(csvEscape).join(";")).join("\r\n");
  // UTF-8 BOM so Excel opens CZ diakritika correctly
  const body = "﻿" + csv;

  const filename = year ? `odecty-${year}.csv` : "odecty.csv";

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
