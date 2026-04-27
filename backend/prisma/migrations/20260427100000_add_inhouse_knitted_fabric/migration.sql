-- CreateTable
CREATE TABLE "InhouseKnittedFabric" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fabric_code" TEXT NOT NULL,
    "purchase_order_no" TEXT NOT NULL,
    "supplier_name_id" INTEGER,
    "particulars" TEXT NOT NULL,
    "total_weight" REAL NOT NULL,
    "rate_per_unit" REAL NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "InhouseKnittedFabric_fabric_code_key" ON "InhouseKnittedFabric"("fabric_code");

-- AlterTable
ALTER TABLE "Dyeing" ADD COLUMN "source_type" TEXT NOT NULL DEFAULT 'KNITTING';
ALTER TABLE "Dyeing" ADD COLUMN "fabric_code" TEXT;
