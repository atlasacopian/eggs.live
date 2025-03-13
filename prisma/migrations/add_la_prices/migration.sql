-- Create the la_egg_prices table
CREATE TABLE IF NOT EXISTS "la_egg_prices" (
  "id" SERIAL PRIMARY KEY,
  "store_location_id" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "eggType" TEXT NOT NULL DEFAULT 'regular',
  FOREIGN KEY ("store_location_id") REFERENCES "store_locations"("id"),
  UNIQUE("store_location_id", "date", "eggType")
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS "la_egg_prices_date_idx" ON "la_egg_prices" ("date");

