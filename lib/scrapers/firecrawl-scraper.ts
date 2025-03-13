interface EggPrice {
  store: string
  price: number
  eggType: string
  unit: string
}

export async function scrapeWithFirecrawl(storeUrl: string, storeName: string): Promise<EggPrice[]> {
  try {
    console.log(`Scraping ${storeName} at ${storeUrl} with Firecrawl...`)

    // Firecrawl API key should be set in environment variables
    const apiKey = process.env.FIRECRAWL_API_KEY

    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY environment variable is not set")
    }

    // Create a custom extraction prompt for egg prices
    const extractionPrompt = `
      Extract all egg prices from this page. For each egg product, provide:
      1. The price (just the number, e.g. 3.99)
      2. The egg type (regular or organic)
      3. The unit (dozen, half-dozen, etc.)
      
      Only include chicken eggs, not duck or other types. Only include whole eggs, not egg whites or other egg products.
      
      Return the data as an array of objects with these properties:
      - store: "${storeName}"
      - price: (number)
      - eggType: "regular" or "organic"
      - unit: "dozen", "half-dozen", etc.
    `

    console.log("Calling Firecrawl API...")

    // Try the correct API endpoint structure
    const response = await fetch("https://firecrawl.dev/api/crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: storeUrl,
        prompt: extractionPrompt,
        format: "json",
      }),
    })

    console.log("Firecrawl API response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Firecrawl API error (${response.status}): ${errorText}`)
    }

    const result = await response.json()
    console.log("Firecrawl API result:", JSON.stringify(result).substring(0, 200) + "...")

    // Check if the result contains egg prices
    if (!result || !Array.isArray(result)) {
      console.warn(`No valid data returned for ${storeName}`)
      return []
    }

    // Filter and validate the results
    const eggPrices = result
      .filter((item) => item && typeof item.price === "number" && item.price > 0 && typeof item.eggType === "string")
      .map((item) => ({
        store: storeName,
        price: item.price,
        eggType: item.eggType.toLowerCase() === "organic" ? "organic" : "regular",
        unit: item.unit || "dozen",
      }))

    console.log(`Found ${eggPrices.length} valid egg prices for ${storeName}`)
    return eggPrices
  } catch (error) {
    console.error(`Error scraping ${storeName}:`, error)
    // Return empty array instead of throwing to allow other stores to be processed
    return []
  }
}

