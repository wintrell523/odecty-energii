import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.meter.count();
  if (existing > 0) {
    console.log(`Seed: již existuje ${existing} měřičů, přeskakuji.`);
    return;
  }

  const owner = await prisma.user.findFirst({ where: { isOwner: true } });

  await prisma.meter.createMany({
    data: [
      { type: "ELECTRICITY", name: "Elektřina", unit: "KWH", ownerId: owner?.id },
      { type: "COLD_WATER", name: "Studená voda", unit: "M3", ownerId: owner?.id },
      { type: "HOT_WATER", name: "Teplá voda", unit: "M3", ownerId: owner?.id },
      { type: "HEAT", name: "Teplo", unit: "GJ", ownerId: owner?.id },
    ],
  });

  console.log("Seed: vytvořeny 4 výchozí měřiče.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
