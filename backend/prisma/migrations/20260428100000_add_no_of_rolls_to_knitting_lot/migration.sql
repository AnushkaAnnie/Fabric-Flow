-- Add no_of_rolls to KnittingLot so the rolls count lives with the dyeing lot.
ALTER TABLE "KnittingLot" ADD COLUMN "no_of_rolls" INTEGER NOT NULL DEFAULT 0;