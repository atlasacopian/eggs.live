export interface StoreLocation {
  name: string
  address: string
  zipCode: string
  latitude?: number
  longitude?: number
}

// Real LA area Walmart locations
const walmartLocations: StoreLocation[] = [
  {
    name: "Walmart",
    address: "4651 Firestone Blvd",
    zipCode: "90280",
    latitude: 33.952,
    longitude: -118.187,
  },
  {
    name: "Walmart",
    address: "8500 Washington Blvd",
    zipCode: "90660",
    latitude: 33.969,
    longitude: -118.088,
  },
  // Add more actual Walmart locations
]

// Real LA area Target locations
const targetLocations: StoreLocation[] = [
  {
    name: "Target",
    address: "2626 Colorado Blvd",
    zipCode: "90041",
    latitude: 34.139,
    longitude: -118.224,
  },
  // Add more actual Target locations
]

// Add other store locations...

export const storeLocations: Record<string, StoreLocation[]> = {
  Walmart: walmartLocations,
  Target: targetLocations,
  // Add other stores...
}

export function isStoreInZipCode(storeName: string, zipCode: string): boolean {
  const locations = storeLocations[storeName] || []
  return locations.some((location) => location.zipCode === zipCode)
}

export function getStoreLocation(storeName: string, zipCode: string): StoreLocation | null {
  const locations = storeLocations[storeName] || []
  return locations.find((location) => location.zipCode === zipCode) || null
}

export function getNearbyStores(storeName: string, zipCode: string, radiusMiles = 5): StoreLocation[] {
  const locations = storeLocations[storeName] || []
  // For now, return all locations - in a real implementation, you'd use geolocation
  return locations
}

