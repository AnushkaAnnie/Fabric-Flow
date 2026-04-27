-- Give existing records unique dc_no
UPDATE "Knitting" SET "dc_no" = 'DC-TEMP-' || "id" WHERE "dc_no" = '';

-- Create unique index on dc_no
CREATE UNIQUE INDEX "Knitting_dc_no_key" ON "Knitting"("dc_no");
