// Define the StoreLocation interface
export interface StoreLocation {
  name: string
  address?: string
  zipCode: string
  latitude?: number
  longitude?: number
  url: string
}

// Helper function to get all LA store locations
export function getAllLAStoreLocations(): StoreLocation[] {
  // Generate a comprehensive list of LA area stores
  const stores = [
    "Walmart",
    "Target",
    "Whole Foods",
    "Ralphs",
    "Vons",
    "Albertsons",
    "Food 4 Less",
    "Sprouts",
    "Erewhon",
    "Gelson's",
    "Smart & Final",
    "Pavilions",
    "Trader Joe's",
    "Costco",
    "Sam's Club",
  ]

  // LA area ZIP codes (a more comprehensive list)
  const zipCodes = [
    "90001",
    "90002",
    "90003",
    "90004",
    "90005",
    "90006",
    "90007",
    "90008",
    "90010",
    "90011",
    "90012",
    "90013",
    "90014",
    "90015",
    "90016",
    "90017",
    "90018",
    "90019",
    "90020",
    "90021",
    "90023",
    "90024",
    "90025",
    "90026",
    "90027",
    "90028",
    "90029",
    "90031",
    "90032",
    "90033",
    "90034",
    "90035",
    "90036",
    "90037",
    "90038",
    "90039",
    "90041",
    "90042",
    "90043",
    "90044",
    "90045",
    "90046",
    "90047",
    "90048",
    "90049",
    "90056",
    "90057",
    "90058",
    "90059",
    "90061",
    "90062",
    "90063",
    "90064",
    "90065",
    "90066",
    "90067",
    "90068",
    "90069",
    "90071",
    "90077",
    "90089",
    "90090",
    "90094",
    "90095",
    "90210",
    "90211",
    "90212",
    "90230",
    "90232",
    "90245",
    "90247",
    "90248",
    "90272",
    "90290",
    "90291",
    "90292",
    "90293",
    "90301",
    "90302",
    "90303",
    "90304",
    "90305",
    "90401",
    "90402",
    "90403",
    "90404",
    "90405",
    "90501",
    "90502",
    "90710",
    "90717",
    "90731",
    "90732",
    "90744",
    "90745",
    "90810",
    "90813",
    "91030",
    "91040",
    "91042",
    "91105",
    "91201",
    "91202",
    "91203",
    "91204",
    "91205",
    "91206",
    "91207",
    "91208",
    "91214",
    "91303",
    "91304",
    "91306",
    "91307",
    "91311",
    "91316",
    "91324",
    "91325",
    "91326",
    "91330",
    "91331",
    "91335",
    "91340",
    "91342",
    "91343",
    "91344",
    "91345",
    "91352",
    "91356",
    "91364",
    "91367",
    "91401",
    "91402",
    "91403",
    "91405",
    "91406",
    "91411",
    "91423",
    "91436",
    "91501",
    "91502",
    "91504",
    "91505",
    "91506",
    "91601",
    "91602",
    "91604",
    "91605",
    "91606",
    "91607",
  ]

  // Generate store URLs
  const storeUrls: Record<string, string> = {
    Walmart: "https://www.walmart.com/search?q=eggs",
    Target: "https://www.target.com/s?searchTerm=eggs",
    "Whole Foods": "https://www.wholefoodsmarket.com/search?text=eggs",
    Ralphs: "https://www.ralphs.com/search?query=eggs",
    Vons: "https://www.vons.com/shop/search-results.html?q=eggs",
    Albertsons: "https://www.albertsons.com/shop/search-results.html?q=eggs",
    "Food 4 Less": "https://www.food4less.com/search?query=eggs",
    Sprouts: "https://shop.sprouts.com/search?search_term=eggs",
    Erewhon: "https://www.erewhonmarket.com/search?q=eggs",
    "Gelson's": "https://www.gelsons.com/shop/search-results.html?q=eggs",
    "Smart & Final": "https://www.smartandfinal.com/shop/search-results.html?q=eggs",
    Pavilions: "https://www.pavilions.com/shop/search-results.html?q=eggs",
    "Trader Joe's": "https://www.traderjoes.com/search?q=eggs",
    Costco: "https://www.costco.com/search?text=eggs",
    "Sam's Club": "https://www.samsclub.com/s/eggs",
  }

  // Create a comprehensive list of store locations
  const allLocations: StoreLocation[] = []

  // For demonstration, let's limit to a reasonable number of combinations
  // We'll use the first 5 stores and first 20 ZIP codes to create 100 combinations
  // In a real scenario, you might want to use actual store location data
  const limitedStores = stores.slice(0, 5)
  const limitedZipCodes = zipCodes.slice(0, 20)

  for (const store of limitedStores) {
    for (const zipCode of limitedZipCodes) {
      allLocations.push({
        name: store,
        zipCode: zipCode,
        url: storeUrls[store] || `https://www.google.com/search?q=${encodeURIComponent(store)}+eggs`,
      })
    }
  }

  console.log(`Generated ${allLocations.length} store locations`)
  return allLocations
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

