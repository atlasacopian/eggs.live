// This file contains all store locations in Los Angeles County for our tracked chains

export interface StoreLocation {
  name: string
  address: string
  zipCode: string
  url: string
  latitude?: number
  longitude?: number
}

// Los Angeles County zip codes (partial list - focusing on populated areas)
const LA_ZIP_CODES = [
  // Central LA
  "90004",
  "90005",
  "90006",
  "90010",
  "90012",
  "90013",
  "90014",
  "90015",
  "90017",
  "90020",
  "90026",
  "90027",
  "90028",
  "90036",
  "90038",
  "90046",
  "90048",
  // East LA
  "90022",
  "90023",
  "90031",
  "90032",
  "90033",
  "90063",
  // South LA
  "90001",
  "90002",
  "90003",
  "90007",
  "90008",
  "90011",
  "90016",
  "90018",
  "90037",
  "90043",
  "90044",
  "90047",
  "90059",
  "90061",
  "90062",
  // West LA
  "90024",
  "90025",
  "90034",
  "90035",
  "90045",
  "90049",
  "90064",
  "90066",
  "90067",
  "90077",
  "90210",
  "90211",
  "90212",
  "90230",
  "90232",
  "90272",
  "90291",
  "90292",
  "90293",
  "90402",
  "90403",
  "90404",
  "90405",
  // San Fernando Valley
  "91040",
  "91042",
  "91303",
  "91304",
  "91306",
  "91307",
  "91311",
  "91316",
  "91324",
  "91325",
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
  "91601",
  "91602",
  "91604",
  "91605",
  "91606",
  "91607",
  // South Bay
  "90245",
  "90247",
  "90248",
  "90250",
  "90254",
  "90260",
  "90266",
  "90274",
  "90277",
  "90278",
  "90301",
  "90302",
  "90303",
  "90304",
  "90305",
  "90501",
  "90502",
  "90503",
  "90504",
  "90505",
  "90710",
  "90717",
  "90731",
  "90732",
  "90744",
  "90745",
  "90746",
  "90747",
  "90755",
  "90802",
  "90803",
  "90804",
  "90805",
  "90806",
  "90807",
  "90808",
  "90810",
  "90813",
  "90814",
  "90815",
  // Gateway Cities
  "90201",
  "90220",
  "90221",
  "90240",
  "90241",
  "90242",
  "90255",
  "90262",
  "90270",
  "90280",
  "90601",
  "90602",
  "90603",
  "90604",
  "90605",
  "90606",
  "90631",
  "90638",
  "90640",
  "90650",
  "90660",
  "90670",
  "90701",
  "90703",
  "90706",
  "90716",
  "90723",
  // San Gabriel Valley
  "91001",
  "91006",
  "91007",
  "91010",
  "91016",
  "91024",
  "91030",
  "91101",
  "91103",
  "91104",
  "91105",
  "91106",
  "91107",
  "91108",
  "91201",
  "91203",
  "91204",
  "91205",
  "91206",
  "91207",
  "91208",
  "91214",
  "91702",
  "91706",
  "91722",
  "91723",
  "91724",
  "91731",
  "91732",
  "91733",
  "91740",
  "91741",
  "91744",
  "91745",
  "91746",
  "91748",
  "91754",
  "91755",
  "91765",
  "91766",
  "91767",
  "91768",
  "91770",
  "91773",
  "91775",
  "91776",
  "91780",
  "91789",
  "91790",
  "91791",
  "91801",
  "91803",
]

// Base URLs for each chain
const CHAIN_BASE_URLS = {
  Walmart: "https://www.walmart.com/search?q=eggs",
  Target: "https://www.target.com/s?searchTerm=eggs",
  "Whole Foods": "https://www.wholefoodsmarket.com/search?text=eggs",
  Ralphs: "https://www.ralphs.com/search?query=eggs",
  Vons: "https://www.vons.com/shop/search-results.html?q=eggs",
  Albertsons: "https://www.albertsons.com/shop/search-results.html?q=eggs",
  "Food 4 Less": "https://www.food4less.com/search?query=eggs&searchType=natural",
  Sprouts: "https://shop.sprouts.com/search?search_term=eggs",
  Erewhon: "https://www.erewhonmarket.com/search?q=eggs",
  "Gelson's": "https://www.gelsons.com/shop/search-results.html?q=eggs",
  "Smart & Final": "https://www.smartandfinal.com/shop/search-results?q=eggs",
  Pavilions: "https://www.pavilions.com/shop/search-results.html?q=eggs",
}

// Generate all store locations for all chains in LA
export function getAllLAStoreLocations(): StoreLocation[] {
  try {
    const allLocations: StoreLocation[] = []

    // For each chain, create a store location for each zip code
    Object.entries(CHAIN_BASE_URLS).forEach(([chainName, baseUrl]) => {
      LA_ZIP_CODES.forEach((zipCode) => {
        allLocations.push({
          name: chainName,
          address: `Los Angeles area (${zipCode})`,
          zipCode: zipCode,
          url: baseUrl,
        })
      })
    })

    console.log(
      `Generated ${allLocations.length} store locations across ${Object.keys(CHAIN_BASE_URLS).length} chains and ${LA_ZIP_CODES.length} zip codes.`,
    )
    return allLocations
  } catch (error) {
    console.error("Error generating LA store locations:", error)
    return []
  }
}

// Get a subset of store locations for testing or limited runs
export function getRepresentativeLAStoreLocations(limit = 50): StoreLocation[] {
  const allLocations = getAllLAStoreLocations()

  // Ensure we get at least one location for each chain
  const chains = Object.keys(CHAIN_BASE_URLS)
  const representativeLocations: StoreLocation[] = []

  chains.forEach((chain) => {
    // Get a few locations for each chain
    const chainLocations = allLocations.filter((loc) => loc.name === chain)
    const locationsPerChain = Math.max(1, Math.floor(limit / chains.length))

    // Select locations evenly distributed across the array
    const step = Math.max(1, Math.floor(chainLocations.length / locationsPerChain))
    for (let i = 0; i < chainLocations.length && representativeLocations.length < limit; i += step) {
      representativeLocations.push(chainLocations[i])
    }
  })

  return representativeLocations.slice(0, limit)
}

// Get all store locations for a specific chain in LA
export function getChainLAStoreLocations(chainName: string): StoreLocation[] {
  return getAllLAStoreLocations().filter((loc) => loc.name === chainName)
}

