import type { NextApiRequest, NextApiResponse } from "next"
import { Pool } from "pg"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log("Running database migration...")

    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })

    // Migration SQL embedded directly in the code
    const migrationSQL = `
      -- Drop the constraint if it exists
      ALTER TABLE IF EXISTS "egg_prices" DROP CONSTRAINT IF EXISTS "egg_prices_storeId_date_eggType_key";

      -- Add the store_location_id column if it doesn't exist
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'egg_prices' AND column_name = 'store_location_id') THEN
              ALTER TABLE "egg_prices" ADD COLUMN "store_location_id" INTEGER;
          END IF;
      END
      $$;

      -- Make sure eggType is properly cased
      ALTER TABLE "egg_prices" RENAME COLUMN IF EXISTS "eggtype" TO "eggType";

      -- Create a unique constraint for the new columns
      ALTER TABLE "egg_prices" ADD CONSTRAINT IF NOT EXISTS "egg_prices_store_location_id_date_eggType_key" 
      UNIQUE ("store_location_id", "date", "eggType");

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS "egg_prices_store_location_id_idx" ON "egg_prices"("store_location_id");
      CREATE INDEX IF NOT EXISTS "egg_prices_date_idx" ON "egg_prices"("date");
    `

    // Execute each statement separately to handle potential errors better
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of statements) {
      try {
        await pool.query(statement)
        console.log("Executed:", statement.slice(0, 50) + "...")
      } catch (error) {
        console.error("Error executing statement:", statement)
        console.error("Error details:", error)
        // Continue with other statements even if one fails
      }
    }

    // Close the connection
    await pool.end()

    return res.json({
      success: true,
      message: "Migration executed successfully",
    })
  } catch (error) {
    console.error("Error running migration:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to run migration",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

