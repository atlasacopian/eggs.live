interface StoreLocation {
  name: string
  address: string
  zipCode: string
  latitude?: number
  longitude?: number
}

// This would ideally be populated from a database or API
// For now, we'll hardcode some sample data
const storeLocations: Record<string, StoreLocation[]> = {
  Walmart: [
    { name: "Walmart", address: "4651 Firestone Blvd", zipCode: "90280" },
    { name: "Walmart", address: "8500 Washington Blvd", zipCode: "90660" },
    // Add more actual Walmart locations
  ],
  Target: [
    { name: "Target", address: "2626 Colorado Blvd", zipCode: "90041" },
    { name: "Target", address: "5600 Whittier Blvd", zipCode: "90022" },
    // Add more actual Target locations
  ],
  // Add other stores...
}

export function validateStoreLocation(storeName: string, zipCode: string): boolean {
  const storeList = storeLocations[storeName] || []
  return storeList.some((location) => location.zipCode === zipCode)
}

export function getStoreLocation(storeName: string, zipCode: string): StoreLocation | null {
  const storeList = storeLocations[storeName] || []
  return storeList.find((location) => location.zipCode === zipCode) || null
}

export function getNearbyStores(zipCode: string, radiusMiles = 5): StoreLocation[] {
  // For now, return stores in adjacent ZIP codes
  // In a real implementation, this would use geolocation
  const stores: StoreLocation[] = []
  Object.values(storeLocations).forEach((locationList) => {
    locationList.forEach((location) => {
      if (isZipCodeNearby(zipCode, location.zipCode, radiusMiles)) {
        stores.push(location)
      }
    })
  })
  return stores
}

// Helper function to check if two ZIP codes are nearby
// This is a simplified version - in reality, you'd want to use actual geo-coordinates
function isZipCodeNearby(zipCode1: string, zipCode2: string, radiusMiles: number): boolean {
  // For now, just check if the first 3 digits match (same general area)
  // In a real implementation, you'd use latitude/longitude calculations
  return zipCode1.substring(0, 3) === zipCode2.substring(0, 3)
}

