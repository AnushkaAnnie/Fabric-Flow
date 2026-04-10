-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MillName" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "KnitterName" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DyerName" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CompacterName" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Colour" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WashType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FabricDescription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Yarn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hk_no" TEXT NOT NULL,
    "mill_name_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "hf_code" TEXT NOT NULL,
    "count" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "no_of_bags" REAL NOT NULL,
    "bag_weight" REAL NOT NULL,
    "total_weight" REAL NOT NULL,
    "rate_per_kg" REAL NOT NULL,
    "total_cost" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Yarn_mill_name_id_fkey" FOREIGN KEY ("mill_name_id") REFERENCES "MillName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Knitting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hk_no" TEXT NOT NULL,
    "lot_no" TEXT NOT NULL,
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
    CONSTRAINT "Knitting_hk_no_fkey" FOREIGN KEY ("hk_no") REFERENCES "Yarn" ("hk_no") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Knitting_knitter_name_id_fkey" FOREIGN KEY ("knitter_name_id") REFERENCES "KnitterName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Knitting_fabric_description_id_fkey" FOREIGN KEY ("fabric_description_id") REFERENCES "FabricDescription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dyeing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    CONSTRAINT "Dyeing_lot_no_fkey" FOREIGN KEY ("lot_no") REFERENCES "Knitting" ("lot_no") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dyeing_dyer_name_id_fkey" FOREIGN KEY ("dyer_name_id") REFERENCES "DyerName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dyeing_wash_type_id_fkey" FOREIGN KEY ("wash_type_id") REFERENCES "WashType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Dyeing_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "Colour" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Compacting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    CONSTRAINT "Compacting_lot_no_fkey" FOREIGN KEY ("lot_no") REFERENCES "Knitting" ("lot_no") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Compacting_compacter_name_id_fkey" FOREIGN KEY ("compacter_name_id") REFERENCES "CompacterName" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Compacting_colour_id_fkey" FOREIGN KEY ("colour_id") REFERENCES "Colour" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "MillName_name_key" ON "MillName"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KnitterName_name_key" ON "KnitterName"("name");

-- CreateIndex
CREATE UNIQUE INDEX "DyerName_name_key" ON "DyerName"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CompacterName_name_key" ON "CompacterName"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Colour_name_key" ON "Colour"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WashType_name_key" ON "WashType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FabricDescription_name_key" ON "FabricDescription"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Yarn_hk_no_key" ON "Yarn"("hk_no");

-- CreateIndex
CREATE UNIQUE INDEX "Knitting_lot_no_key" ON "Knitting"("lot_no");

-- CreateIndex
CREATE UNIQUE INDEX "Dyeing_lot_no_key" ON "Dyeing"("lot_no");

-- CreateIndex
CREATE UNIQUE INDEX "Compacting_lot_no_key" ON "Compacting"("lot_no");
