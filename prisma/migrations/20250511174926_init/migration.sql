-- CreateTable
CREATE TABLE "closure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "start" DATETIME NOT NULL,
    "end" DATETIME NOT NULL,
    "lastUpdate" DATETIME NOT NULL,
    "description" TEXT,
    "hindrance" TEXT NOT NULL,
    "geometry" TEXT NOT NULL,
    "handled" BOOLEAN NOT NULL DEFAULT false
);
