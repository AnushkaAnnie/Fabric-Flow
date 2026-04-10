/*
  Warnings:

  - You are about to drop the column `lot_no` on the `Knitting` table. All the data in the column will be lost.
  - Added the required column `hk_no` to the `Compacting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hk_no` to the `Dyeing` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Compacting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hk_no" TEXT NOT NULL,
    "lot_no" TEXT NOT NULL,
    "initial_weight" REAL NOT NULL,
    "compacter_name_id" INTEGER NOT NULL,
    "final_dia" REAL NOT NULL,
    "colour_id" INTEGER NOT NULL,
    "final_weight" REAL NOT NULL,
    "final_gsm" REAL NOT NULL,
    "process_loss" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Compacting_compacter_name_id_fkey" FOREIGN KEY ("compacter_name_id") REFERENCES "CompacterName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Compacting_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "Colour" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Compacting" ("colour_id", "compacter_name_id", "createdAt", "date", "final_dia", "final_gsm", "final_weight", "id", "initial_weight", "lot_no", "process_loss", "updatedAt") SELECT "colour_id", "compacter_name_id", "createdAt", "date", "final_dia", "final_gsm", "final_weight", "id", "initial_weight", "lot_no", "process_loss", "updatedAt" FROM "Compacting";
DROP TABLE "Compacting";
ALTER TABLE "new_Compacting" RENAME TO "Compacting";
CREATE UNIQUE INDEX "Compacting_lot_no_key" ON "Compacting"("lot_no");
CREATE TABLE "new_Dyeing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hk_no" TEXT NOT NULL,
    "lot_no" TEXT NOT NULL,
    "initial_weight" REAL NOT NULL,
    "dyer_name_id" INTEGER NOT NULL,
    "wash_type_id" INTEGER NOT NULL,
    "colour_id" INTEGER NOT NULL,
    "gg" REAL NOT NULL,
    "initial_dia" REAL NOT NULL,
    "final_dia" REAL NOT NULL,
    "initial_gsm" REAL NOT NULL,
    "final_gsm" REAL NOT NULL,
    "final_quantity" REAL NOT NULL,
    "no_of_rolls" INTEGER NOT NULL,
    "final_weight" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dyeing_dyer_name_id_fkey" FOREIGN KEY ("dyer_name_id") REFERENCES "DyerName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dyeing_wash_type_id_fkey" FOREIGN KEY ("wash_type_id") REFERENCES "WashType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dyeing_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "Colour" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Dyeing" ("colour_id", "createdAt", "date", "dyer_name_id", "final_dia", "final_gsm", "final_quantity", "final_weight", "gg", "id", "initial_dia", "initial_gsm", "initial_weight", "lot_no", "no_of_rolls", "updatedAt", "wash_type_id") SELECT "colour_id", "createdAt", "date", "dyer_name_id", "final_dia", "final_gsm", "final_quantity", "final_weight", "gg", "id", "initial_dia", "initial_gsm", "initial_weight", "lot_no", "no_of_rolls", "updatedAt", "wash_type_id" FROM "Dyeing";
DROP TABLE "Dyeing";
ALTER TABLE "new_Dyeing" RENAME TO "Dyeing";
CREATE UNIQUE INDEX "Dyeing_lot_no_key" ON "Dyeing"("lot_no");
CREATE TABLE "new_Knitting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hk_no" TEXT NOT NULL,
    "hf_code" TEXT NOT NULL,
    "knitter_name_id" INTEGER NOT NULL,
    "yarn_quantity" REAL NOT NULL,
    "loop_length" REAL NOT NULL,
    "dia" REAL NOT NULL,
    "count" TEXT NOT NULL,
    "gauge" TEXT NOT NULL,
    "date_given" DATETIME NOT NULL,
    "fabric_description_id" INTEGER NOT NULL,
    "grey_fabric_weight" REAL NOT NULL,
    "gsm" REAL NOT NULL,
    "no_of_rolls" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Knitting_knitter_name_id_fkey" FOREIGN KEY ("knitter_name_id") REFERENCES "KnitterName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Knitting_fabric_description_id_fkey" FOREIGN KEY ("fabric_description_id") REFERENCES "FabricDescription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Knitting" ("count", "createdAt", "date", "date_given", "dia", "fabric_description_id", "gauge", "grey_fabric_weight", "gsm", "hf_code", "hk_no", "id", "knitter_name_id", "loop_length", "no_of_rolls", "updatedAt", "yarn_quantity") SELECT "count", "createdAt", "date", "date_given", "dia", "fabric_description_id", "gauge", "grey_fabric_weight", "gsm", "hf_code", "hk_no", "id", "knitter_name_id", "loop_length", "no_of_rolls", "updatedAt", "yarn_quantity" FROM "Knitting";
DROP TABLE "Knitting";
ALTER TABLE "new_Knitting" RENAME TO "Knitting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
