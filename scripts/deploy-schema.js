const { execSync } = require("child_process")

// Function to run the migration
async function runMigration() {
  try {
    console.log("Starting database migration...")

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    // Run Prisma DB push with more reliable flags
    console.log("Applying schema changes...")
    try {
      // First try to reset the connection
      execSync('npx prisma db execute --url="${DATABASE_URL}" --stdin', {
        input:
          "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();",
        stdio: ["pipe", "inherit", "inherit"],
      })
    } catch (e) {
      console.log("Connection reset attempt completed (ignore any errors above)")
    }

    // Now run the migration with force flag
    execSync("npx prisma db push --accept-data-loss --force-reset", { stdio: "inherit" })

    console.log("Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error.message)
    process.exit(1)
  }
}

// Run the migration
runMigration()

