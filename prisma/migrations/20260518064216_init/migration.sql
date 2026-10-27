-- CreateTable
CREATE TABLE "Meter" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "meterId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "value" DECIMAL NOT NULL,
    "note" TEXT,
    CONSTRAINT "Reading_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "meterId" INTEGER NOT NULL,
    "validFrom" DATETIME NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    "monthlyFee" DECIMAL NOT NULL DEFAULT 0,
    "note" TEXT,
    CONSTRAINT "Tariff_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Reading_meterId_date_idx" ON "Reading"("meterId", "date");

-- CreateIndex
CREATE INDEX "Tariff_meterId_validFrom_idx" ON "Tariff"("meterId", "validFrom");
