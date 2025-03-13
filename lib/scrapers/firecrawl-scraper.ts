interface EggPrice {
  store: string
  price: number
  eggType: string
  unit: string
}

export async function scrapeWithFirecrawl(storeUrl: string, storeName: string): Promise<EggPrice[]> {
  try {
    console.log(`Scraping ${storeName} at ${storeUrl} with Firecrawl...`)

    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY environment variable is not set")
    }

    // Simplified selector-based approach
    const response = await fetch("https://firecrawl.dev/api/crawl", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: storeUrl,
        selectors: {
          products: ".product-item", // Generic product container class
          fields: {
            title: ".product-title, .item-name, .product-name", // Common product title classes
            price: ".product-price, .price, .item-price", // Common price classes
          },
        },
        // Add debug flag to get more information
        debug: true,
      }),
    })

    console.log("Firecrawl API response status:", response.status)

    // Log the full response for debugging
    const responseText = await response.text()
    console.log("Raw API response:", responseText)

    if (!response.ok) {
      throw new Error(`Firecrawl API error (${response.status}): ${responseText}`)
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      console.error("Failed to parse JSON response:", e)
      return []
    }

    console.log("Parsed result:", result)

    // If we got debug information, log it
    if (result.debug) {
      console.log("Debug info:", result.debug)
    }

    // Extract and validate the products
    const products = result.data?.products || []
    console.log(`Found ${products.length} potential products`)

    // Process each product
    const eggPrices = products
      .filter((product) => {
        const title = (product.title || "").toLowerCase()
        // Only include products that are clearly eggs
        return title.includes("egg") && !title.includes("whites") && !title.includes("substitute")
      })
      .map((product) => {
        // Extract price from string (handle different formats)
        const priceMatch = (product.price || "").match(/\d+\.?\d*/)
        const price = priceMatch ? Number.parseFloat(priceMatch[0]) : null

        // Determine if organic
        const isOrganic = (product.title || "").toLowerCase().includes("organic")

        if (price && price > 0) {
          return {
            store: storeName,
            price: price,
            eggType: isOrganic ? "organic" : "regular",
            unit: "dozen", // Default to dozen
          }
        }
        return null
      })
      .filter(Boolean)

    console.log(`Extracted ${eggPrices.length} valid egg prices for ${storeName}`)
    return eggPrices
  } catch (error) {
    console.error(`Error scraping ${storeName}:`, error)
    return []
  }
}

