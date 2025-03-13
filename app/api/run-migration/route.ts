import { NextResponse } from "next/server"
import { Pool } from "pg"

// Tell Next.js this is a dynamic route
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Get the admin key from the URL
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    // Check if the key matches
    if (key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: "DATABASE_URL environment variable is not set",
        },
        { status: 500 },
      )
    }

    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })

    // Run the migration SQL
    const migrationSQL = `
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
    `

    await pool.query(migrationSQL)

    // Seed some basic store data
    const seedSQL = `
    -- Insert basic store data if not exists
    INSERT INTO "store" ("name")
    VALUES 
      ('Food 4 Less'),
      ('Albertsons'),
      ('H-E-B'),
      ('Meijer'),
      ('Sprouts'),
      ('Erewhon'),
      ('Food Lion'),
      ('Giant Eagle'),
      ('Ralphs'),
      ('Shop Rite'),
      ('Stop and Shop'),
      ('Vons'),
      ('Winn Dixie'),
      ('Weis Markets'),
      ('Harris Teeter'),
      ('Smart & Final'),
      ('Gelson''s'),
      ('Pavilions')
    ON CONFLICT (name) DO NOTHING;
    `

    await pool.query(seedSQL)

    // Close the connection
    await pool.end()

    return NextResponse.json({
      success: true,
      message: "Database migration and seeding completed successfully",
    })
  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json(
      {
        error: "Database migration failed",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

