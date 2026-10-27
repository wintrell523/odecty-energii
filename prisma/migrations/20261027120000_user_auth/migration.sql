CREATE TABLE "User" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "isOwner" BOOLEAN NOT NULL DEFAULT false,
  "disabled" BOOLEAN NOT NULL DEFAULT false,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
  "failedLogins" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" DATETIME
);
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

CREATE TABLE "Session" (
  "tokenHash" TEXT NOT NULL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "lastUsedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

ALTER TABLE "Meter" ADD COLUMN "ownerId" INTEGER REFERENCES "User"("id");
CREATE INDEX "Meter_ownerId_idx" ON "Meter"("ownerId");
