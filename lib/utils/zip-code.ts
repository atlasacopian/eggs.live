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

