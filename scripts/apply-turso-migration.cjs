// Applies one Prisma migration SQL file to Turso. Turso was created without
// _prisma_migrations, so `prisma migrate deploy` cannot be used there.
// Usage: node --env-file=.env.local scripts/apply-turso-migration.cjs prisma/migrations/<name>/migration.sql
const { createClient } = require("@libsql/client");
const fs = require("node:fs");

(async () => {
  const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
  const before = await db.execute("select name from sqlite_master where type='table' and name in ('User','Session')");
  if (before.rows.length) throw new Error("User/Session already exist; refusing to re-apply");
  const stmts = fs.readFileSync(process.argv[2], "utf8").split(";").map((s) => s.trim()).filter(Boolean);
  await db.batch(stmts, "write");
  const tables = (await db.execute("select name from sqlite_master where type='table' order by name")).rows.map((r) => r.name);
  const meterCols = (await db.execute("pragma table_info('Meter')")).rows.map((r) => r.name);
  const counts = {};
  for (const t of ["Meter", "Reading", "Tariff", "User", "Session"]) counts[t] = (await db.execute(`select count(*) n from "${t}"`)).rows[0].n;
  console.log(JSON.stringify({ statements: stmts.length, tables, meterCols, counts }, null, 2));
})().catch((e) => { console.error(e.message); process.exit(1); });
