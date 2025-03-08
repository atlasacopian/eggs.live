// This script can be run manually to seed historical data
const { execSync } = require("child_process")

async function seedHistoricalData() {
  try {
    // Load environment variables
    require("dotenv").config()

    // Make a request to the seed historical API endpoint
    const apiKey = process.env.SCRAPER_API_KEY
    const url = `http://localhost:3000/api/seed-historical?key=${apiKey}`

    console.log("Seeding historical egg price data...")

    // Use curl to make the request
    execSync(`curl -X POST "${url}"`, { stdio: "inherit" })

    console.log("Historical data seeding completed successfully")
  } catch (error) {
    console.error("Error seeding historical data:", error)
    process.exit(1)
  }
}

seedHistoricalData()

