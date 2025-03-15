const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Function to run the migration
async function runMigration() {
  try {
    console.log("Starting database migration...")

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    // Run Prisma DB push to apply schema changes
    console.log("Applying schema changes...")
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" })

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error.message)
    process.exit(1)
  }
}

// Run the migration
runMigration()

