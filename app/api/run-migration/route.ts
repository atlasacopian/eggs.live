import { NextResponse } from "next/server"
import { Pool } from "pg"
import fs from "fs"
import path from "path"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("Running database migration...")

    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "prisma/migrations/fix_egg_prices/migration.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    await pool.query(migrationSQL)

    // Close the connection
    await pool.end()

    return NextResponse.json({
      success: true,
      message: "Migration executed successfully",
    })
  } catch (error) {
    console.error("Error running migration:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run migration",
        message: error.message,
      },
      { status: 500 },
    )
  }
}

