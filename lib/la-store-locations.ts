// Update any references to zipCode in this file to match the database schema

export interface StoreLocation {
  name: string
  address?: string
  zipCode: string // Keep this as zipCode for the interface
  latitude?: number
  longitude?: number
  url: string
}

// Helper function to get all LA store locations
export function getAllLAStoreLocations(): StoreLocation[] {
  // This function should return all possible LA store locations
  // For now, we'll return a sample of locations
  return [
    {
      name: "Walmart",
      address: "1234 Main St",
      zipCode: "90001",
      url: "https://www.walmart.com/search?q=eggs",
    },
    {
      name: "Target",
      address: "5678 Broadway",
      zipCode: "90002",
      url: "https://www.target.com/s?searchTerm=eggs",
    },
    // Add more store locations as needed
    {
      name: "Whole Foods",
      address: "9012 Sunset Blvd",
      zipCode: "90046",
      url: "https://www.wholefoodsmarket.com/search?text=eggs",
    },
    {
      name: "Ralphs",
      address: "3456 Venice Blvd",
      zipCode: "90019",
      url: "https://www.ralphs.com/search?query=eggs",
    },
    // Add more LA neighborhoods
    {
      name: "Walmart",
      address: "5678 Crenshaw Blvd",
      zipCode: "90043",
      url: "https://www.walmart.com/search?q=eggs",
    },
    {
      name: "Target",
      address: "9012 La Brea Ave",
      zipCode: "90036",
      url: "https://www.target.com/s?searchTerm=eggs",
    },
  ]
}

// Helper function to get a representative sample of LA store locations
export function getRepresentativeLAStoreLocations(count = 20): StoreLocation[] {
  const allLocations = getAllLAStoreLocations()

  // If count is greater than or equal to the total number of locations, return all
  if (count >= allLocations.length) {
    return allLocations
  }

  // Otherwise, return a random sample
  const shuffled = [...allLocations].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

