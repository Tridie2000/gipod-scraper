-- CreateTable
CREATE TABLE "closure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "lastUpdate" DATETIME NOT NULL,
    "description" TEXT,
    "hindrance" TEXT NOT NULL,
    "geometry" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

