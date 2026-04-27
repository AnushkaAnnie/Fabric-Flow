-- CreateTable: KnittingYarnUsage
CREATE TABLE "KnittingYarnUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "knitting_id" INTEGER NOT NULL,
    "yarn_id" INTEGER NOT NULL,
    "hf_code" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnittingYarnUsage_knitting_id_fkey" FOREIGN KEY ("knitting_id") REFERENCES "Knitting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnittingYarnUsage_yarn_id_fkey" FOREIGN KEY ("yarn_id") REFERENCES "Yarn" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable: KnittingLot
CREATE TABLE "KnittingLot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "knitting_id" INTEGER NOT NULL,
    "lot_no" TEXT NOT NULL,
    "dyer_name_id" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnittingLot_knitting_id_fkey" FOREIGN KEY ("knitting_id") REFERENCES "Knitting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnittingLot_dyer_name_id_fkey" FOREIGN KEY ("dyer_name_id") REFERENCES "DyerName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "KnittingLot_lot_no_key" ON "KnittingLot"("lot_no");

-- CreateTable: KnittingLotEntry
CREATE TABLE "KnittingLotEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "knitting_lot_id" INTEGER NOT NULL,
    "colour_id" INTEGER NOT NULL,
    "weight" REAL NOT NULL,
    "dyeing_id" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnittingLotEntry_knitting_lot_id_fkey" FOREIGN KEY ("knitting_lot_id") REFERENCES "KnittingLot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnittingLotEntry_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "Colour" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- AlterTable Dyeing: add knitting_lot_entry_id
ALTER TABLE "Dyeing" ADD COLUMN "knitting_lot_entry_id" INTEGER;
