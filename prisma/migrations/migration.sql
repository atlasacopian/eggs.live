-- CreateTable
CREATE TABLE "store" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "egg_prices" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "eggType" TEXT NOT NULL DEFAULT 'regular',

    CONSTRAINT "egg_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_locations" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "store_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "echo_park_egg_prices" (
    "id" SERIAL NOT NULL,
    "store_location_id" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "eggType" TEXT NOT NULL DEFAULT 'regular',

    CONSTRAINT "echo_park_egg_prices_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "egg_prices" ADD CONSTRAINT "egg_prices_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_locations" ADD CONSTRAINT "store_locations_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "echo_park_egg_prices" ADD CONSTRAINT "echo_park_egg_prices_store_location_id_fkey" FOREIGN KEY ("store_location_id") REFERENCES "store_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

