-- Create the store table if it doesn't exist
CREATE TABLE IF NOT EXISTS "store" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL
);

-- Create the egg_prices table with the correct schema
CREATE TABLE IF NOT EXISTS "egg_prices" (
  "id" SERIAL PRIMARY KEY,
  "store_id" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "eggType" TEXT NOT NULL DEFAULT 'regular',
  CONSTRAINT "egg_prices_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create the store_locations table
CREATE TABLE IF NOT EXISTS "store_locations" (
  "id" SERIAL PRIMARY KEY,
  "store_id" INTEGER NOT NULL,
  "address" TEXT NOT NULL,
  "zipCode" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  CONSTRAINT "store_locations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create the echo_park_egg_prices table
CREATE TABLE IF NOT EXISTS "echo_park_egg_prices" (
  "id" SERIAL PRIMARY KEY,
  "store_location_id" INTEGER NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "eggType" TEXT NOT NULL DEFAULT 'regular',
  CONSTRAINT "echo_park_egg_prices_store_location_id_fkey" FOREIGN KEY ("store_location_id") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

