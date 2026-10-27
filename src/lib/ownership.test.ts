import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import { expect, it } from "vitest";

const Database = createRequire(import.meta.url)("better-sqlite3");

it("scopes reads and writes through the meter owner", async () => {
  const dir = mkdtempSync(join(tmpdir(), "odecty-ownership-"));
  const url = `file:${join(dir, "test.db")}`;
  const sqlite = new Database(join(dir, "test.db"));
  sqlite.exec(readFileSync("prisma/migrations/20260518064216_init/migration.sql", "utf8"));
  sqlite.exec(readFileSync("prisma/migrations/20261027120000_user_auth/migration.sql", "utf8"));
  sqlite.close();
  const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
  try {
    const first = await db.user.create({ data: { username: "first", passwordHash: "test" } });
    const second = await db.user.create({ data: { username: "second", passwordHash: "test" } });
    const meter = await db.meter.create({ data: { ownerId: first.id, name: "Water", type: "COLD_WATER", unit: "M3" } });
    const reading = await db.reading.create({ data: { meterId: meter.id, date: new Date(), value: 1 } });
    expect(await db.reading.findMany({ where: { meter: { ownerId: second.id } } })).toEqual([]);
    expect((await db.reading.updateMany({ where: { id: reading.id, meter: { ownerId: second.id } }, data: { note: "changed" } })).count).toBe(0);
    expect((await db.meter.deleteMany({ where: { id: meter.id, ownerId: second.id } })).count).toBe(0);
    expect((await db.reading.deleteMany({ where: { id: reading.id, meter: { ownerId: first.id } } })).count).toBe(1);
  } finally {
    await db.$disconnect();
    rmSync(dir, { recursive: true, force: true });
  }
});
