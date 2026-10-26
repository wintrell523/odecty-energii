import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function makeClient() {
  if (process.env.TURSO_DATABASE_URL) {
    if (!process.env.TURSO_AUTH_TOKEN) throw new Error("TURSO_AUTH_TOKEN is required");
    return new PrismaClient({
      adapter: new PrismaLibSql({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }),
    });
  }

  // The shell may export a non-sqlite DATABASE_URL (e.g. a Postgres URL from
  // .zshrc) that shadows the project's `.env`. This app is hard-wired to
  // better-sqlite3, so anything that isn't a sqlite-shaped URL is ignored in
  // favor of the conventional `prisma/dev.db` path.
  const envUrl = process.env.DATABASE_URL;
  const isSqliteUrl =
    !!envUrl &&
    (envUrl.startsWith("file:") ||
      envUrl.endsWith(".db") ||
      envUrl.endsWith(".sqlite"));
  const url = isSqliteUrl ? (envUrl as string) : "file:./prisma/dev.db";
  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
