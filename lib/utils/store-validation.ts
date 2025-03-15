// A simplified store validation utility

// Define the stores we support
const SUPPORTED_STORES = [
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
]

// Simple mapping of ZIP codes to stores that exist there
// This is a simplified example - you would expand this with real data
const ZIP_CODE_STORE_MAP: Record<string, string[]> = {
  "90001": ["Walmart", "Target", "Food 4 Less"],
  "90002": ["Walmart", "Ralphs"],
  "90003": ["Target", "Vons", "Food 4 Less"],
  "90004": ["Whole Foods", "Ralphs", "Vons"],
  "90005": ["Target", "Ralphs", "Sprouts"],
  "90006": ["Food 4 Less", "Smart & Final"],
  "90007": ["Target", "Ralphs"],
  "90008": ["Vons", "Smart & Final"],
  "90010": ["Whole Foods", "Ralphs"],
  "90011": ["Food 4 Less", "Smart & Final"],
  "90012": ["Whole Foods", "Ralphs"],
  "90013": ["Ralphs", "Smart & Final"],
  "90014": ["Whole Foods"],
  "90015": ["Target", "Ralphs"],
  "90016": ["Food 4 Less", "Smart & Final"],
  "90017": ["Whole Foods", "Ralphs"],
  "90018": ["Food 4 Less", "Smart & Final"],
  "90019": ["Ralphs", "Vons"],
  "90020": ["Whole Foods", "Ralphs"],
  "90021": ["Smart & Final"],
  "90023": ["Food 4 Less", "Smart & Final"],
  "90024": ["Whole Foods", "Ralphs", "Gelson's"],
  "90025": ["Whole Foods", "Ralphs", "Vons"],
  "90026": ["Vons", "Gelson's"], // No Walmart in 90026
  "90027": ["Ralphs", "Vons", "Gelson's"],
  "90028": ["Ralphs", "Vons"],
  "90029": ["Food 4 Less", "Smart & Final"],
  "90031": ["Food 4 Less"],
  "90032": ["Food 4 Less", "Smart & Final"],
  "90033": ["Food 4 Less", "Smart & Final"],
  "90034": ["Ralphs", "Vons", "Sprouts"],
  "90035": ["Whole Foods", "Ralphs"],
  "90036": ["Whole Foods", "Ralphs", "Vons"],
  "90037": ["Food 4 Less", "Smart & Final"],
  "90038": ["Ralphs", "Vons"],
  "90039": ["Ralphs", "Vons"],
  "90041": ["Target", "Vons"],
  "90042": ["Food 4 Less", "Smart & Final"],
  "90043": ["Food 4 Less", "Smart & Final"],
  "90044": ["Food 4 Less", "Smart & Final"],
  "90045": ["Ralphs", "Vons", "Whole Foods"],
  "90046": ["Whole Foods", "Ralphs", "Gelson's"],
  "90047": ["Food 4 Less", "Smart & Final"],
  "90048": ["Whole Foods", "Ralphs", "Gelson's"],
  "90049": ["Whole Foods", "Ralphs", "Gelson's"],
  "90056": ["Ralphs", "Vons"],
  "90057": ["Food 4 Less", "Smart & Final"],
  "90058": ["Food 4 Less", "Smart & Final"],
  "90059": ["Food 4 Less", "Smart & Final"],
  "90061": ["Food 4 Less", "Smart & Final"],
  "90062": ["Food 4 Less", "Smart & Final"],
  "90063": ["Food 4 Less", "Smart & Final"],
  "90064": ["Whole Foods", "Ralphs", "Vons"],
  "90065": ["Food 4 Less", "Smart & Final"],
  "90066": ["Ralphs", "Vons", "Whole Foods"],
  "90067": ["Whole Foods", "Ralphs", "Gelson's"],
  "90068": ["Ralphs", "Gelson's"],
  "90069": ["Whole Foods", "Ralphs", "Gelson's"],
  "90071": ["Whole Foods"],
  "90077": ["Whole Foods", "Ralphs", "Gelson's"],
  "90210": ["Whole Foods", "Ralphs", "Gelson's"],
  "90211": ["Whole Foods", "Ralphs", "Gelson's"],
  "90212": ["Whole Foods", "Ralphs", "Gelson's"],
  "90230": ["Ralphs", "Vons", "Sprouts"],
  "90232": ["Ralphs", "Vons"],
  "90245": ["Ralphs", "Vons"],
  "90247": ["Food 4 Less", "Smart & Final"],
  "90248": ["Food 4 Less", "Smart & Final"],
  "90272": ["Ralphs", "Gelson's"],
  "90280": ["Walmart", "Food 4 Less", "Smart & Final"],
  "90290": ["Ralphs", "Gelson's"],
  "90291": ["Whole Foods", "Ralphs", "Gelson's"],
  "90292": ["Ralphs", "Gelson's"],
  "90293": ["Ralphs", "Vons"],
  "90401": ["Whole Foods", "Vons"],
  "90402": ["Whole Foods", "Gelson's"],
  "90403": ["Whole Foods", "Vons"],
  "90404": ["Whole Foods", "Vons"],
  "90405": ["Whole Foods", "Vons"],
  "90660": ["Walmart", "Food 4 Less", "Smart & Final"],
}

/**
 * Checks if a store exists in a given ZIP code
 */
export function storeExistsInZipCode(storeName: string, zipCode: string): boolean {
  // If we don't have data for this ZIP code, assume the store doesn't exist there
  if (!ZIP_CODE_STORE_MAP[zipCode]) {
    return false
  }

  // Check if the store exists in this ZIP code
  return ZIP_CODE_STORE_MAP[zipCode].includes(storeName)
}

/**
 * Gets nearby ZIP codes that have the requested store
 */
export function getNearbyZipCodesWithStore(storeName: string, zipCode: string): string[] {
  // This is a simplified implementation
  // In a real app, you'd use geolocation to find truly nearby ZIP codes

  // For now, just return all ZIP codes that have this store
  return Object.entries(ZIP_CODE_STORE_MAP)
    .filter(([_, stores]) => stores.includes(storeName))
    .map(([zip, _]) => zip)
    .filter((zip) => zip !== zipCode) // Exclude the original ZIP code
    .slice(0, 5) // Limit to 5 results
}

