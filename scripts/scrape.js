// This script can be run manually to trigger scraping
const { execSync } = require("child_process")

async function runScraper() {
  try {
    // Load environment variables
    require("dotenv").config()

    // Make a request to the scraper API endpoint
    const apiKey = process.env.SCRAPER_API_KEY
    const url = `http://localhost:3000/api/scrape?key=${apiKey}`

    console.log("Running egg price scraper...")

    // Use curl to make the request
    execSync(`curl -X POST "${url}"`, { stdio: "inherit" })

    console.log("Scraping completed successfully")
  } catch (error) {
    console.error("Error running scraper:", error)
    process.exit(1)
  }
}

runScraper()

