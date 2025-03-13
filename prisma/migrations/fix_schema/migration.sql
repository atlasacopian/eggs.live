-- Drop existing tables if they exist
DROP TABLE IF EXISTS "egg_prices" CASCADE;
DROP TABLE IF EXISTS "la_egg_prices" CASCADE;
DROP TABLE IF EXISTS "store_locations" CASCADE;
DROP TABLE IF EXISTS "store" CASCADE;

-- Create the store table
CREATE TABLE "store" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "website" TEXT
);

-- Create the store_locations table
CREATE TABLE "store_locations" (
  "id" SERIAL PRIMARY KEY,
  "store_id" INTEGER NOT NULL,
  "address" TEXT,
  "zipCode" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  FOREIGN KEY ("store_id") REFERENCES "store"("id")
);

-- Create index on zipCode for faster queries
CREATE INDEX "store_locations_zipcode_idx" ON "store_locations"("zipCode");

-- Create the la_egg_prices table
CREATE TABLE "la_egg_prices" (
  "id" SERIAL PRIMARY KEY,
  "store_location_id" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "eggType" TEXT NOT NULL DEFAULT 'regular',
  FOREIGN KEY ("store_location_id") REFERENCES "store_locations"("id")
);

-- Create indexes for better query performance
CREATE INDEX "la_egg_prices_date_idx" ON "la_egg_prices"("date");
CREATE UNIQUE INDEX "la_egg_prices_unique_idx" ON "la_egg_prices"("store_location_id", "date", "eggType");

-- Create the egg_prices table for historical data
CREATE TABLE "egg_prices" (
  "id" SERIAL PRIMARY KEY,
  "store_location_id" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "eggType" TEXT NOT NULL DEFAULT 'regular'
);

-- Create indexes for better query performance
CREATE INDEX "egg_prices_date_idx" ON "egg_prices"("date");
CREATE INDEX "egg_prices_store_location_id_idx" ON "egg_prices"("store_location_id");

