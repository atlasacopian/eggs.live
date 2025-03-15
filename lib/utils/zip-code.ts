/**
 * Formats a store URL with the correct ZIP code parameter based on the store name
 */
export function formatStoreUrlWithZipCode(baseUrl: string, storeName: string, zipCode: string): string {
  // Default approach - append zipCode parameter
  let url = baseUrl

  // Store-specific URL formatting
  switch (storeName) {
    case "Walmart":
      // Walmart uses 'zipCode' parameter
      if (!url.includes("zipCode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipCode=${zipCode}`
      }
      break

    case "Target":
      // Target uses 'zipcode' parameter (lowercase 'c')
      if (!url.includes("zipcode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipcode=${zipCode}`
      }
      break

    case "Whole Foods":
      // Whole Foods uses 'location' parameter
      if (!url.includes("location=")) {
        url += (url.includes("?") ? "&" : "?") + `location=${zipCode}`
      }
      break

    // Kroger-owned stores
    case "Ralphs":
    case "Food 4 Less":
      // Kroger-owned stores use 'locationId' parameter
      if (!url.includes("locationId=")) {
        url += (url.includes("?") ? "&" : "?") + `locationId=${zipCode}`
      }
      break

    // Albertsons Companies stores
    case "Albertsons":
    case "Vons":
    case "Pavilions":
      // Albertsons Companies stores use 'zipcode' parameter
      if (!url.includes("zipcode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipcode=${zipCode}`
      }
      break

    case "Sprouts":
      // Sprouts uses 'postal_code' parameter
      if (!url.includes("postal_code=")) {
        url += (url.includes("?") ? "&" : "?") + `postal_code=${zipCode}`
      }
      break

    case "Erewhon":
      // Erewhon uses 'postalCode' parameter
      if (!url.includes("postalCode=")) {
        url += (url.includes("?") ? "&" : "?") + `postalCode=${zipCode}`
      }
      break

    case "Gelson's":
      // Gelson's uses 'zip' parameter
      if (!url.includes("zip=")) {
        url += (url.includes("?") ? "&" : "?") + `zip=${zipCode}`
      }
      break

    case "Smart & Final":
      // Smart & Final uses 'zipcode' parameter
      if (!url.includes("zipcode=")) {
        url += (url.includes("?") ? "&" : "?") + `zipcode=${zipCode}`
      }
      break

    default:
      // For any other stores, use the most common format
      if (!url.includes("zipCode=") && !url.includes("zipcode=") && !url.includes("zip=")) {
        url += (url.includes("?") ? "&" : "?") + `zipCode=${zipCode}`
      }
      break
  }

  return url
}

/**
 * Extracts a ZIP code from a URL with any of the known parameter formats
 */
export function extractZipCodeFromUrl(url: string): string | null {
  const zipCodeMatch = url.match(
    /[?&](zipCode|zipcode|zip|postal_code|postalCode|location|locationId|storeZipCode)=(\d{5})/i,
  )
  return zipCodeMatch ? zipCodeMatch[2] : null
}

/**
 * Validates a US ZIP code format
 */
export function isValidZipCode(zipCode: string): boolean {
  return /^\d{5}$/.test(zipCode)
}

/**
 * Gets the appropriate ZIP code parameter name for a given store
 */
export function getZipCodeParameterForStore(storeName: string): string {
  switch (storeName) {
    case "Target":
    case "Albertsons":
    case "Vons":
    case "Pavilions":
    case "Smart & Final":
      return "zipcode"
    case "Whole Foods":
      return "location"
    case "Ralphs":
    case "Food 4 Less":
      return "locationId"
    case "Sprouts":
      return "postal_code"
    case "Erewhon":
      return "postalCode"
    case "Gelson's":
      return "zip"
    case "Shop Rite":
    case "ShopRite":
      return "storeZipCode"
    default:
      return "zipCode"
  }
}

/**
 * Gets the appropriate headers to simulate a browser with location
 */
export function getLocationHeaders(zipCode: string): Record<string, string> {
  // These headers help simulate a browser with location information
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    // Some sites check these headers for general location
    "X-Forwarded-For": getIpForZipCode(zipCode),
    "CF-IPCountry": "US",
    "CF-IPCity": getCityForZipCode(zipCode) || "Los Angeles",
    "CF-IPRegion": "CA",
  }
}

/**
 * Gets a simulated IP address for a ZIP code (very simplified)
 */
function getIpForZipCode(zipCode: string): string {
  // This is a simplified mock function
  // In reality, you'd use a geolocation database
  return `192.168.${zipCode.substring(0, 1)}.${zipCode.substring(1, 3)}`
}

/**
 * Gets a city name for a ZIP code (simplified)
 */
function getCityForZipCode(zipCode: string): string | null {
  // Simplified mapping of some LA ZIP codes to cities
  const zipToCityMap: Record<string, string> = {
    "90001": "Los Angeles",
    "90026": "Los Angeles",
    "90210": "Beverly Hills",
    "90272": "Pacific Palisades",
    "90291": "Venice",
    "90401": "Santa Monica",
    // Add more as needed
  }

  return zipToCityMap[zipCode] || null
}

/**
 * Creates a cookie string for location-based cookies
 */
export function getLocationCookies(storeName: string, zipCode: string): string {
  // Different stores use different cookie formats
  switch (storeName) {
    case "Walmart":
      return `location-data={"postalCode":"${zipCode}","city":"Los Angeles","state":"CA"};`

    case "Target":
      return `GuestLocation=${zipCode}|Los Angeles|CA;`

    case "Whole Foods":
      return `wfm_location_data={"postalCode":"${zipCode}","city":"Los Angeles","state":"CA"};`

    // Add more store-specific cookie formats as needed

    default:
      return `location=${zipCode}; zipcode=${zipCode};`
  }
}

