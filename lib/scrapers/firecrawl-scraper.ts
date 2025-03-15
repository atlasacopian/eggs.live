import type { EggPrice } from "../types"
import { extractZipCodeFromUrl, getLocationHeaders, getLocationCookies } from "../utils/zip-code"
import { storeExistsInZipCode } from "../utils/store-validation"
import { getStoreLocation } from "../data/store-locations"

// Real FirecrawlClient class
export class FirecrawlClient {
  private apiKey: string
  private maxRetries: number
  private timeout: number
  private baseUrl: string

  constructor(options: { apiKey: string; maxRetries?: number; timeout?: number }) {
    this.apiKey = options.apiKey
    this.maxRetries = options.maxRetries || 3
    this.timeout = options.timeout || 60000
    // Update this line with the URL that worked from the diagnostic test
    this.baseUrl = "https://api.firecrawl.dev" // Replace with working URL
  }

  async scrape(url: string, options?: any): Promise<{ status: number; content: string; finalUrl: string }> {
    console.log(`Attempting to scrape URL with Firecrawl: ${url}`)
    console.log(`Using API key: ${this.apiKey ? this.apiKey.substring(0, 5) + "..." : "Not set"}`)

    const { headers, cookies, formActions, waitForSelector, javascript = true } = options || {}

    try {
      // Prepare the request payload
      const payload = {
        url,
        headers,
        cookies,
        actions: formActions,
        wait_for: waitForSelector,
        javascript,
        timeout: this.timeout,
        retry: this.maxRetries,
      }

      console.log("Firecrawl payload:", JSON.stringify(payload, null, 2))

      // Make the API request to Firecrawl
      const response = await fetch(`${this.baseUrl}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      console.log(`Firecrawl API response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Firecrawl API error response: ${errorText}`)
        throw new Error(`Firecrawl API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      console.log("Firecrawl API response received successfully")

      return {
        status: data.status || 200,
        content: data.html || "",
        finalUrl: data.final_url || url,
      }
    } catch (error) {
      console.error("Firecrawl scraping error:", error)
      throw error
    }
  }

  async extract(url: string, schema: any, options?: any): Promise<any> {
    console.log(`Extracting data with Firecrawl from: ${url}`)

    try {
      // Prepare the request payload
      const payload = {
        url,
        schema,
        ...options,
      }

      // Make the API request to Firecrawl
      const response = await fetch(`${this.baseUrl}/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Firecrawl API error (${response.status}): ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Firecrawl extraction error:", error)
      throw error
    }
  }
}

// Initialize Firecrawl client with the API key from environment variables
const firecrawlClient = new FirecrawlClient({
  apiKey: process.env.FIRECRAWL_API_KEY || "",
  maxRetries: 2,
  timeout: 60000, // 60 seconds
})

// Real scraping function using Firecrawl
export async function scrapeWithFirecrawl(
  url: string,
  storeName: string,
  expectedZipCode: string,
): Promise<{
  prices: EggPrice[]
  locationVerified: boolean
  formFilled: boolean
  actualLocation?: {
    name: string
    address: string
    zipCode: string
  }
  sourceDetails: {
    originalUrl: string
    finalUrl: string
    redirected: boolean
    formActions: any[]
    headers: Record<string, string>
    cookies: string
    extractedZipCode: string | null
  }
}> {
  console.log(`Scraping ${storeName} at URL: ${url} (expecting ZIP code: ${expectedZipCode})`)

  // Get location-specific headers and cookies
  const headers = getLocationHeaders(expectedZipCode)
  const cookies = getLocationCookies(storeName, expectedZipCode)
  const formActions = getFormActionsForStore(storeName, expectedZipCode)

  try {
    // Step 1: Scrape the page with Firecrawl
    const scrapeResult = await firecrawlClient.scrape(url, {
      headers,
      cookies,
      formActions,
      waitForSelector: '.product-price, .price, [data-testid="price"]', // Common price selectors
      javascript: true,
    })

    // Step 2: Extract structured data using Firecrawl
    const schema = getExtractionSchemaForStore(storeName)
    const extractionResult = await firecrawlClient.extract(scrapeResult.finalUrl, schema, {
      html: scrapeResult.content, // Pass the HTML content to avoid another request
    })

    // Step 3: Process the extracted data
    const prices: EggPrice[] = []
    let locationVerified = false
    let actualLocation = undefined

    // Process regular eggs price
    if (extractionResult.regularEggs) {
      const regularPrice = parsePrice(extractionResult.regularEggs)
      if (regularPrice > 0) {
        prices.push({
          price: regularPrice,
          eggType: "regular",
          inStock: !extractionResult.regularOutOfStock,
          fromRealData: true,
        })
      }
    }

    // Process organic eggs price
    if (extractionResult.organicEggs) {
      const organicPrice = parsePrice(extractionResult.organicEggs)
      if (organicPrice > 0) {
        prices.push({
          price: organicPrice,
          eggType: "organic",
          inStock: !extractionResult.organicOutOfStock,
          fromRealData: true,
        })
      }
    }

    // Process location information
    if (extractionResult.storeLocation) {
      actualLocation = {
        name: extractionResult.storeLocation.name || storeName,
        address: extractionResult.storeLocation.address || "Address not available",
        zipCode:
          extractionResult.storeLocation.zipCode || extractZipCodeFromUrl(scrapeResult.finalUrl) || expectedZipCode,
      }

      // Verify if the location matches the expected ZIP code
      locationVerified = actualLocation.zipCode === expectedZipCode
    } else {
      // Fall back to store location from our database
      const dbLocation = getStoreLocation(storeName, expectedZipCode)
      if (dbLocation) {
        actualLocation = {
          name: dbLocation.name,
          address: dbLocation.address,
          zipCode: dbLocation.zipCode,
        }
        locationVerified = true
      }
    }

    // Create source details for debugging
    const sourceDetails = {
      originalUrl: url,
      finalUrl: scrapeResult.finalUrl,
      redirected: url !== scrapeResult.finalUrl,
      formActions,
      headers,
      cookies,
      extractedZipCode: extractZipCodeFromUrl(scrapeResult.finalUrl),
    }

    return {
      prices,
      locationVerified,
      formFilled: formActions.length > 0,
      actualLocation,
      sourceDetails,
    }
  } catch (error) {
    console.error(`Error scraping ${storeName} at ${url}:`, error)

    // Fall back to mock data if scraping fails
    return fallbackToMockData(url, storeName, expectedZipCode, formActions, headers, cookies)
  }
}

// Helper function to parse price strings into numbers
function parsePrice(priceString: string): number {
  if (!priceString) return 0

  // Remove currency symbols and other non-numeric characters except decimal point
  const cleanedPrice = priceString.replace(/[^\d.]/g, "")
  const price = Number.parseFloat(cleanedPrice)

  return isNaN(price) ? 0 : price
}

// Get extraction schema based on store
function getExtractionSchemaForStore(storeName: string): any {
  // Define store-specific extraction schemas
  switch (storeName) {
    case "Walmart":
      return {
        regularEggs: {
          selector: '[data-testid="price"]',
          type: "text",
          multiple: false,
        },
        organicEggs: {
          selector: '.organic-product [data-testid="price"]',
          type: "text",
          multiple: false,
        },
        regularOutOfStock: {
          selector: ".out-of-stock-message",
          type: "exists",
          multiple: false,
        },
        organicOutOfStock: {
          selector: ".organic-product .out-of-stock-message",
          type: "exists",
          multiple: false,
        },
        storeLocation: {
          name: {
            selector: ".store-name",
            type: "text",
          },
          address: {
            selector: ".store-address",
            type: "text",
          },
          zipCode: {
            selector: ".store-zip",
            type: "text",
          },
        },
      }

    case "Erewhon":
      return {
        regularEggs: {
          selector: '.product-item:contains("Eggs") .product-price',
          type: "text",
          multiple: false,
        },
        organicEggs: {
          selector: '.product-item:contains("Organic Eggs") .product-price',
          type: "text",
          multiple: false,
        },
        regularOutOfStock: {
          selector: '.product-item:contains("Eggs") .out-of-stock',
          type: "exists",
          multiple: false,
        },
        organicOutOfStock: {
          selector: '.product-item:contains("Organic Eggs") .out-of-stock',
          type: "exists",
          multiple: false,
        },
        storeLocation: {
          name: {
            selector: ".store-details .store-name",
            type: "text",
          },
          address: {
            selector: ".store-details .store-address",
            type: "text",
          },
          zipCode: {
            selector: ".store-details .store-zip",
            type: "text",
          },
        },
      }

    // Add more store-specific schemas as needed

    default:
      // Generic schema that works for most stores
      return {
        regularEggs: {
          selector: '.product-price, .price, [data-testid="price"]',
          type: "text",
          multiple: false,
        },
        organicEggs: {
          selector: ".organic .product-price, .organic .price",
          type: "text",
          multiple: false,
        },
        regularOutOfStock: {
          selector: ".out-of-stock, .sold-out",
          type: "exists",
          multiple: false,
        },
        organicOutOfStock: {
          selector: ".organic .out-of-stock, .organic .sold-out",
          type: "exists",
          multiple: false,
        },
        storeLocation: {
          name: {
            selector: ".store-name, .location-name",
            type: "text",
          },
          address: {
            selector: ".store-address, .location-address",
            type: "text",
          },
          zipCode: {
            selector: ".store-zip, .location-zip",
            type: "text",
          },
        },
      }
  }
}

// Fallback to mock data if real scraping fails
function fallbackToMockData(
  url: string,
  storeName: string,
  expectedZipCode: string,
  formActions: any[],
  headers: Record<string, string>,
  cookies: string,
): any {
  console.log(`⚠️ FALLING BACK TO MOCK DATA for ${storeName} at ${expectedZipCode}`)
  console.log(`⚠️ This means the real Firecrawl API call failed or was skipped`)

  // Check if this store exists in this ZIP code
  const storeExists = storeExistsInZipCode(storeName, expectedZipCode)

  // Get real store location data if available
  const realLocation = getStoreLocation(storeName, expectedZipCode)

  // Generate mock location data, using real data if available
  const mockLocation = realLocation || {
    name: storeName,
    address: `${Math.floor(Math.random() * 1000) + 100} Main St`,
    zipCode: storeExists ? expectedZipCode : "00000",
  }

  // Generate mock prices based on store type
  const prices: EggPrice[] = []

  // Store-specific base prices
  let regularBasePrice = 3.99
  let organicBasePrice = 5.99

  // Adjust base prices based on store
  switch (storeName) {
    case "Erewhon":
      regularBasePrice = 8.99
      organicBasePrice = 11.99
      break
    case "Whole Foods":
    case "Gelson's":
      regularBasePrice = 4.99
      organicBasePrice = 7.49
      break
    case "Walmart":
    case "Food 4 Less":
      regularBasePrice = 3.49
      organicBasePrice = 5.49
      break
    // Add other stores as needed
  }

  // Add some randomization
  const randomVariation = (min: number, max: number) => Math.random() * (max - min) + min

  // Regular eggs
  prices.push({
    price: Math.round((regularBasePrice + randomVariation(-0.2, 0.5)) * 100) / 100,
    eggType: "regular",
    inStock: Math.random() > 0.2,
    fromRealData: false,
  })

  // Organic eggs
  prices.push({
    price: Math.round((organicBasePrice + randomVariation(-0.3, 0.7)) * 100) / 100,
    eggType: "organic",
    inStock: Math.random() > 0.3,
    fromRealData: false,
  })

  return {
    prices,
    locationVerified: storeExists,
    formFilled: formActions.length > 0,
    actualLocation: mockLocation,
    sourceDetails: {
      originalUrl: url,
      finalUrl: url,
      redirected: false,
      formActions,
      headers,
      cookies,
      extractedZipCode: extractZipCodeFromUrl(url),
    },
  }
}

/**
 * Gets the form actions needed to set the ZIP code for a specific store
 */
function getFormActionsForStore(storeName: string, zipCode: string): any[] {
  // Define the actions to perform on the page
  const actions = []

  switch (storeName) {
    case "Walmart":
      // For Walmart, we need to:
      // 1. Click on the location icon/button
      actions.push({
        type: "click",
        selector: ".LocationSelectionButton, button[data-testid='location-selection']",
      })

      // 2. Wait for the location modal to appear
      actions.push({
        type: "wait",
        selector: "#zipCode, input[data-testid='zip-code-input']",
        timeout: 5000,
      })

      // 3. Fill in the ZIP code input
      actions.push({
        type: "fill",
        selector: "#zipCode, input[data-testid='zip-code-input']",
        value: zipCode,
      })

      // 4. Click the submit button
      actions.push({
        type: "click",
        selector: "#zipCode-form-submit, button[data-testid='zip-code-form-submit']",
        waitForNavigation: true,
      })
      break

    case "Target":
      // For Target, we need to:
      // 1. Click on the location/store selector
      actions.push({
        type: "click",
        selector: "[data-test='@web/StoreLocationButton'], .StoreLocationButton",
      })

      // 2. Wait for the location modal to appear
      actions.push({
        type: "wait",
        selector: "[data-test='@web/Search-Input'], #zip-or-city-state",
        timeout: 5000,
      })

      // 3. Fill in the ZIP code input
      actions.push({
        type: "fill",
        selector: "[data-test='@web/Search-Input'], #zip-or-city-state",
        value: zipCode,
      })

      // 4. Click the submit button
      actions.push({
        type: "click",
        selector: "[data-test='@web/Search-Button'], .SearchButton",
        waitForNavigation: true,
      })
      break

    case "Erewhon":
      // For Erewhon, we need to:
      // 1. Click on the location selector
      actions.push({
        type: "click",
        selector: ".store-selector, .location-selector, [data-testid='store-selector']",
      })

      // 2. Fill in the ZIP code input
      actions.push({
        type: "fill",
        selector: "#postalCode, #zipCode, input[name='postalCode'], input[name='zipCode']",
        value: zipCode,
      })

      // 3. Click the submit button
      actions.push({
        type: "click",
        selector: "button[type='submit'], .submit-button, .store-selector-submit",
        waitForNavigation: true,
      })
      break

    // Add more stores as needed

    default:
      // For stores we don't have specific instructions for,
      // we'll try a generic approach

      // Look for common location/ZIP code input patterns
      actions.push({
        type: "fill",
        selector:
          'input[name="zipcode"], input[name="zip"], input[name="postalCode"], input[id="zipcode"], input[id="zip"], input[id="postalCode"]',
        value: zipCode,
      })

      // Try to find and click a submit button
      actions.push({
        type: "click",
        selector: 'button[type="submit"], input[type="submit"], .submit-button, .zip-submit',
        waitForNavigation: true,
      })
      break
  }

  return actions
}

