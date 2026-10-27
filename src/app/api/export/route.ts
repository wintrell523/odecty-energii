import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withConsumption } from "@/lib/calculations";
import { formatDate, unitLabel, meterTypeLabel, type MeterType, type Unit } from "@/lib/format";
import { parseYear } from "@/lib/years";
import { currentUser } from "@/lib/auth";

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
  const user = await currentUser();
  if (!user || user.mustChangePassword) return new NextResponse(null, { status: 401 });
  const url = new URL(req.url);
  const yearParam = url.searchParams.get("year");
  const year = parseYear(yearParam);
  // An empty ?year= means no filter, the same as no parameter.
  if (yearParam && year === null) {
    return NextResponse.json({ error: "Neplatný rok" }, { status: 400 });
  }

  const periodStart = year ? new Date(year, 0, 1) : null;
  const periodEnd = year ? new Date(year + 1, 0, 1) : null;
  const where = { meter: { ownerId: user.id }, ...(periodStart && periodEnd
    ? { date: { gte: periodStart, lt: periodEnd } }
    : {}) };

  const selectedReadings = await prisma.reading.findMany({
    where,
    orderBy: [{ meterId: "asc" }, { date: "asc" }],
    include: { meter: true },
  });

  // Include each affected meter's last reading before the period, so the first
  // exported row can show consumption relative to its actual preceding reading.
  const meterIds = [...new Set(selectedReadings.map((reading) => reading.meterId))];
  const precedingReadings = periodStart
    ? (
        await Promise.all(
          meterIds.map((meterId) =>
            prisma.reading.findFirst({
              where: { meterId, meter: { ownerId: user.id }, date: { lt: periodStart } },
              orderBy: { date: "desc" },
              include: { meter: true },
            }),
          ),
        )
      ).filter((reading) => reading != null)
    : [];
  // byMeter below keeps insertion order, so each meter's preceding reading stays first.
  const readings = [...precedingReadings, ...selectedReadings];

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
      if (periodStart && e.date < periodStart) continue;
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
  const body = "\uFEFF" + csv;

  const filename = year ? `odecty-${year}.csv` : "odecty.csv";

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
