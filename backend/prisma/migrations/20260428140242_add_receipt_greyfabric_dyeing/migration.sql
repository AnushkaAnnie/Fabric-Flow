/*
  Warnings:

  - You are about to drop the column `final_gsm` on the `Compacting` table. All the data in the column will be lost.
  - You are about to drop the column `final_gsm` on the `Dyeing` table. All the data in the column will be lost.
  - You are about to drop the column `final_quantity` on the `Dyeing` table. All the data in the column will be lost.
  - You are about to drop the column `initial_gsm` on the `Dyeing` table. All the data in the column will be lost.
  - You are about to drop the column `gsm` on the `Knitting` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Yarn` table. All the data in the column will be lost.
  - Added the required column `process_loss` to the `Dyeing` table without a default value. This is not possible if the table is not empty.
  - Made the column `dc_no` on table `Knitting` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CompacterName" ADD COLUMN "address_line1" TEXT;
ALTER TABLE "CompacterName" ADD COLUMN "address_line2" TEXT;
ALTER TABLE "CompacterName" ADD COLUMN "address_line3" TEXT;
ALTER TABLE "CompacterName" ADD COLUMN "email" TEXT;
ALTER TABLE "CompacterName" ADD COLUMN "gstn" TEXT;
ALTER TABLE "CompacterName" ADD COLUMN "pin_code" TEXT;
ALTER TABLE "CompacterName" ADD COLUMN "state" TEXT;

-- AlterTable
ALTER TABLE "DyerName" ADD COLUMN "address_line1" TEXT;
ALTER TABLE "DyerName" ADD COLUMN "address_line2" TEXT;
ALTER TABLE "DyerName" ADD COLUMN "address_line3" TEXT;
ALTER TABLE "DyerName" ADD COLUMN "email" TEXT;
ALTER TABLE "DyerName" ADD COLUMN "gstn" TEXT;
ALTER TABLE "DyerName" ADD COLUMN "pin_code" TEXT;
ALTER TABLE "DyerName" ADD COLUMN "state" TEXT;

-- AlterTable
ALTER TABLE "MillName" ADD COLUMN "address_line1" TEXT;
ALTER TABLE "MillName" ADD COLUMN "address_line2" TEXT;
ALTER TABLE "MillName" ADD COLUMN "address_line3" TEXT;
ALTER TABLE "MillName" ADD COLUMN "email" TEXT;
ALTER TABLE "MillName" ADD COLUMN "gstn" TEXT;
ALTER TABLE "MillName" ADD COLUMN "pin_code" TEXT;
ALTER TABLE "MillName" ADD COLUMN "state" TEXT;

-- CreateTable
CREATE TABLE "YarnReceipt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "yarnId" INTEGER NOT NULL,
    "quantity" REAL NOT NULL,
    "receiptDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dcNo" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "YarnReceipt_yarnId_fkey" FOREIGN KEY ("yarnId") REFERENCES "Yarn" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GreyFabric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "knittingId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "gauge" TEXT,
    "loopLength" REAL,
    "diameter" REAL,
    "gsm" REAL,
    "quantity" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GreyFabric_knittingId_fkey" FOREIGN KEY ("knittingId") REFERENCES "Knitting" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DyeingOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dcNo" TEXT NOT NULL,
    "dyerName" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DyeingLot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dyeingOrderId" INTEGER NOT NULL,
    "knittingId" INTEGER NOT NULL,
    "colour" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DyeingLot_dyeingOrderId_fkey" FOREIGN KEY ("dyeingOrderId") REFERENCES "DyeingOrder" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DyeingLot_knittingId_fkey" FOREIGN KEY ("knittingId") REFERENCES "Knitting" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Compacting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hf_code" TEXT NOT NULL,
    "count" TEXT NOT NULL DEFAULT '',
    "lot_no" TEXT NOT NULL,
    "initial_weight" REAL NOT NULL,
    "compacter_name_id" INTEGER NOT NULL,
    "final_dia" REAL NOT NULL,
    "colour_id" INTEGER NOT NULL,
    "final_weight" REAL NOT NULL,
    "process_loss" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Compacting_compacter_name_id_fkey" FOREIGN KEY ("compacter_name_id") REFERENCES "CompacterName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Compacting_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "Colour" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Compacting" ("colour_id", "compacter_name_id", "createdAt", "date", "final_dia", "final_weight", "hf_code", "id", "initial_weight", "lot_no", "process_loss", "updatedAt") SELECT "colour_id", "compacter_name_id", "createdAt", "date", "final_dia", "final_weight", "hf_code", "id", "initial_weight", "lot_no", "process_loss", "updatedAt" FROM "Compacting";
DROP TABLE "Compacting";
ALTER TABLE "new_Compacting" RENAME TO "Compacting";
CREATE UNIQUE INDEX "Compacting_lot_no_key" ON "Compacting"("lot_no");
CREATE TABLE "new_Dyeing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hf_code" TEXT NOT NULL,
    "source_type" TEXT NOT NULL DEFAULT 'KNITTING',
    "fabric_code" TEXT,
    "count" TEXT NOT NULL DEFAULT '',
    "lot_no" TEXT NOT NULL,
    "initial_weight" REAL NOT NULL,
    "dyer_name_id" INTEGER NOT NULL,
    "wash_type_id" INTEGER NOT NULL,
    "colour_id" INTEGER NOT NULL,
    "gg" REAL NOT NULL,
    "initial_dia" REAL NOT NULL,
    "final_dia" REAL NOT NULL,
    "no_of_rolls" INTEGER NOT NULL,
    "final_weight" REAL NOT NULL,
    "process_loss" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "knitting_lot_entry_id" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dyeing_dyer_name_id_fkey" FOREIGN KEY ("dyer_name_id") REFERENCES "DyerName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dyeing_wash_type_id_fkey" FOREIGN KEY ("wash_type_id") REFERENCES "WashType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dyeing_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "Colour" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Dyeing" ("colour_id", "createdAt", "date", "dyer_name_id", "fabric_code", "final_dia", "final_weight", "gg", "hf_code", "id", "initial_dia", "initial_weight", "knitting_lot_entry_id", "lot_no", "no_of_rolls", "source_type", "updatedAt", "wash_type_id") SELECT "colour_id", "createdAt", "date", "dyer_name_id", "fabric_code", "final_dia", "final_weight", "gg", "hf_code", "id", "initial_dia", "initial_weight", "knitting_lot_entry_id", "lot_no", "no_of_rolls", "source_type", "updatedAt", "wash_type_id" FROM "Dyeing";
DROP TABLE "Dyeing";
ALTER TABLE "new_Dyeing" RENAME TO "Dyeing";
CREATE UNIQUE INDEX "Dyeing_lot_no_key" ON "Dyeing"("lot_no");
CREATE TABLE "new_InhouseKnittedFabric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fabric_code" TEXT NOT NULL,
    "purchase_order_no" TEXT NOT NULL,
    "invoice_no" TEXT NOT NULL DEFAULT '',
    "supplier_name_id" INTEGER,
    "particulars" TEXT NOT NULL,
    "total_weight" REAL NOT NULL,
    "rate_per_unit" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_InhouseKnittedFabric" ("amount", "created_at", "date", "fabric_code", "id", "particulars", "purchase_order_no", "rate_per_unit", "supplier_name_id", "total_weight") SELECT "amount", "created_at", "date", "fabric_code", "id", "particulars", "purchase_order_no", "rate_per_unit", "supplier_name_id", "total_weight" FROM "InhouseKnittedFabric";
DROP TABLE "InhouseKnittedFabric";
ALTER TABLE "new_InhouseKnittedFabric" RENAME TO "InhouseKnittedFabric";
CREATE UNIQUE INDEX "InhouseKnittedFabric_fabric_code_key" ON "InhouseKnittedFabric"("fabric_code");
CREATE TABLE "new_KnitterName" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "address_line1" TEXT,
    "address_line2" TEXT,
    "address_line3" TEXT,
    "state" TEXT,
    "pin_code" TEXT,
    "gstn" TEXT,
    "email" TEXT,
    "yarn_balance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_KnitterName" ("createdAt", "id", "name") SELECT "createdAt", "id", "name" FROM "KnitterName";
DROP TABLE "KnitterName";
ALTER TABLE "new_KnitterName" RENAME TO "KnitterName";
CREATE UNIQUE INDEX "KnitterName_name_key" ON "KnitterName"("name");
CREATE TABLE "new_Knitting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hf_code" TEXT NOT NULL,
    "dc_no" TEXT NOT NULL,
    "knitter_name_id" INTEGER NOT NULL,
    "total_yarn_qty" REAL NOT NULL DEFAULT 0,
    "loop_length" REAL NOT NULL,
    "dia" REAL NOT NULL,
    "count" TEXT NOT NULL,
    "gauge" TEXT NOT NULL,
    "date_given" DATETIME NOT NULL,
    "fabric_description_id" INTEGER NOT NULL,
    "grey_fabric_weight" REAL NOT NULL,
    "received_weight" REAL,
    "other_yarn_type" TEXT,
    "other_yarn_percentage" REAL,
    "no_of_rolls" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Knitting_knitter_name_id_fkey" FOREIGN KEY ("knitter_name_id") REFERENCES "KnitterName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Knitting_fabric_description_id_fkey" FOREIGN KEY ("fabric_description_id") REFERENCES "FabricDescription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Knitting" ("count", "createdAt", "date", "date_given", "dc_no", "dia", "fabric_description_id", "gauge", "grey_fabric_weight", "hf_code", "id", "knitter_name_id", "loop_length", "no_of_rolls", "other_yarn_percentage", "other_yarn_type", "received_weight", "updatedAt") SELECT "count", "createdAt", "date", "date_given", "dc_no", "dia", "fabric_description_id", "gauge", "grey_fabric_weight", "hf_code", "id", "knitter_name_id", "loop_length", "no_of_rolls", "other_yarn_percentage", "other_yarn_type", "received_weight", "updatedAt" FROM "Knitting";
DROP TABLE "Knitting";
ALTER TABLE "new_Knitting" RENAME TO "Knitting";
CREATE UNIQUE INDEX "Knitting_dc_no_key" ON "Knitting"("dc_no");
CREATE TABLE "new_KnittingLot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "knitting_id" INTEGER NOT NULL,
    "lot_no" TEXT NOT NULL,
    "job_work_no" TEXT NOT NULL DEFAULT '',
    "no_of_rolls" INTEGER NOT NULL DEFAULT 0,
    "dyer_name_id" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnittingLot_knitting_id_fkey" FOREIGN KEY ("knitting_id") REFERENCES "Knitting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnittingLot_dyer_name_id_fkey" FOREIGN KEY ("dyer_name_id") REFERENCES "DyerName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_KnittingLot" ("createdAt", "dyer_name_id", "id", "job_work_no", "knitting_id", "lot_no", "no_of_rolls", "updatedAt") SELECT "createdAt", "dyer_name_id", "id", coalesce("job_work_no", '') AS "job_work_no", "knitting_id", "lot_no", "no_of_rolls", "updatedAt" FROM "KnittingLot";
DROP TABLE "KnittingLot";
ALTER TABLE "new_KnittingLot" RENAME TO "KnittingLot";
CREATE UNIQUE INDEX "KnittingLot_lot_no_key" ON "KnittingLot"("lot_no");
CREATE TABLE "new_KnittingLotEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "knitting_lot_id" INTEGER NOT NULL,
    "colour_id" INTEGER NOT NULL,
    "weight" REAL NOT NULL,
    "dyeing_id" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnittingLotEntry_knitting_lot_id_fkey" FOREIGN KEY ("knitting_lot_id") REFERENCES "KnittingLot" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnittingLotEntry_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "Colour" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_KnittingLotEntry" ("colour_id", "createdAt", "dyeing_id", "id", "knitting_lot_id", "updatedAt", "weight") SELECT "colour_id", "createdAt", "dyeing_id", "id", "knitting_lot_id", "updatedAt", "weight" FROM "KnittingLotEntry";
DROP TABLE "KnittingLotEntry";
ALTER TABLE "new_KnittingLotEntry" RENAME TO "KnittingLotEntry";
CREATE TABLE "new_KnittingYarnUsage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "knitting_id" INTEGER NOT NULL,
    "yarn_id" INTEGER NOT NULL,
    "hf_code" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnittingYarnUsage_knitting_id_fkey" FOREIGN KEY ("knitting_id") REFERENCES "Knitting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnittingYarnUsage_yarn_id_fkey" FOREIGN KEY ("yarn_id") REFERENCES "Yarn" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_KnittingYarnUsage" ("createdAt", "hf_code", "id", "knitting_id", "quantity", "updatedAt", "yarn_id") SELECT "createdAt", "hf_code", "id", "knitting_id", "quantity", "updatedAt", "yarn_id" FROM "KnittingYarnUsage";
DROP TABLE "KnittingYarnUsage";
ALTER TABLE "new_KnittingYarnUsage" RENAME TO "KnittingYarnUsage";
CREATE TABLE "new_Yarn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hf_code" TEXT NOT NULL,
    "purchase_order_no" TEXT NOT NULL DEFAULT '',
    "invoice_no" TEXT NOT NULL DEFAULT '',
    "delivery_to" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "mill_name_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "count" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "no_of_bags" REAL NOT NULL,
    "bag_weight" REAL NOT NULL,
    "total_weight" REAL NOT NULL,
    "rate_per_kg" REAL NOT NULL,
    "total_cost" REAL NOT NULL,
    "issued_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Yarn_mill_name_id_fkey" FOREIGN KEY ("mill_name_id") REFERENCES "MillName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Yarn" ("bag_weight", "count", "createdAt", "description", "hf_code", "id", "mill_name_id", "no_of_bags", "quality", "rate_per_kg", "total_cost", "total_weight", "updatedAt") SELECT "bag_weight", "count", "createdAt", "description", "hf_code", "id", "mill_name_id", "no_of_bags", "quality", "rate_per_kg", "total_cost", "total_weight", "updatedAt" FROM "Yarn";
DROP TABLE "Yarn";
ALTER TABLE "new_Yarn" RENAME TO "Yarn";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GreyFabric_knittingId_key" ON "GreyFabric"("knittingId");

-- CreateIndex
CREATE UNIQUE INDEX "DyeingOrder_dcNo_key" ON "DyeingOrder"("dcNo");
