import { NextResponse } from "next/server"
import { Pool } from "pg"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")

    if (key !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error: "DATABASE_URL environment variable is not set",
        },
        { status: 500 },
      )
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })

    // Drop existing tables if they exist
    const dropTablesSQL = `
      DROP TABLE IF EXISTS echo_park_egg_prices CASCADE;
      DROP TABLE IF EXISTS store_locations CASCADE;
      DROP TABLE IF EXISTS egg_prices CASCADE;
      DROP TABLE IF EXISTS store CASCADE;
    `

    await pool.query(dropTablesSQL)

    // Create tables with proper constraints
    const createTablesSQL = `
      CREATE TABLE store (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      );

      CREATE TABLE egg_prices (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        date TIMESTAMP(3) NOT NULL,
        eggType TEXT NOT NULL DEFAULT 'regular',
        FOREIGN KEY (store_id) REFERENCES store(id),
        UNIQUE(store_id, date, eggType)
      );

      CREATE TABLE store_locations (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        address TEXT NOT NULL,
        zipCode TEXT NOT NULL,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        FOREIGN KEY (store_id) REFERENCES store(id),
        UNIQUE(store_id, zipCode)
      );

      CREATE TABLE echo_park_egg_prices (
        id SERIAL PRIMARY KEY,
        store_location_id INTEGER NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        date TIMESTAMP(3) NOT NULL,
        eggType TEXT NOT NULL DEFAULT 'regular',
        FOREIGN KEY (store_location_id) REFERENCES store_locations(id),
        UNIQUE(store_location_id, date, eggType)
      );
    `

    await pool.query(createTablesSQL)

    // Seed basic store data
    const seedSQL = `
      INSERT INTO store (name) VALUES 
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

