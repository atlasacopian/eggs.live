import { findNearbyZipCodes } from "./zip-distance"

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

// Updated ZIP code store mapping with correct Erewhon locations
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
  "90026": ["Vons", "Gelson's", "Erewhon"], // Added Erewhon to Silver Lake
  "90027": ["Ralphs", "Vons", "Gelson's", "Erewhon"],
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

// Mock ZIP_COORDINATES and calculateDistance for demonstration.  In a real application,
// these would likely come from a database or external API.
const ZIP_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "90001": { lat: 33.97, lng: -118.25 },
  "90002": { lat: 33.94, lng: -118.24 },
  "90003": { lat: 33.96, lng: -118.27 },
  "90004": { lat: 34.07, lng: -118.31 },
  "90005": { lat: 34.05, lng: -118.3 },
  "90006": { lat: 34.04, lng: -118.29 },
  "90007": { lat: 34.02, lng: -118.28 },
  "90008": { lat: 34.0, lng: -118.33 },
  "90010": { lat: 34.06, lng: -118.3 },
  "90011": { lat: 34.01, lng: -118.26 },
  "90012": { lat: 34.06, lng: -118.25 },
  "90013": { lat: 34.04, lng: -118.24 },
  "90014": { lat: 34.03, lng: -118.26 },
  "90015": { lat: 34.03, lng: -118.27 },
  "90016": { lat: 34.01, lng: -118.34 },
  "90017": { lat: 34.05, lng: -118.27 },
  "90018": { lat: 34.01, lng: -118.35 },
  "90019": { lat: 34.04, lng: -118.35 },
  "90020": { lat: 34.07, lng: -118.3 },
  "90021": { lat: 34.03, lng: -118.23 },
  "90023": { lat: 34.07, lng: -118.22 },
  "90024": { lat: 34.07, lng: -118.44 },
  "90025": { lat: 34.06, lng: -118.45 },
  "90026": { lat: 34.08, lng: -118.26 },
  "90027": { lat: 34.1, lng: -118.29 },
  "90028": { lat: 34.1, lng: -118.32 },
  "90029": { lat: 34.09, lng: -118.3 },
  "90031": { lat: 34.07, lng: -118.21 },
  "90032": { lat: 34.07, lng: -118.19 },
  "90033": { lat: 34.05, lng: -118.18 },
  "90034": { lat: 34.04, lng: -118.4 },
  "90035": { lat: 34.06, lng: -118.36 },
  "90036": { lat: 34.06, lng: -118.34 },
  "90037": { lat: 33.99, lng: -118.28 },
  "90038": { lat: 34.09, lng: -118.34 },
  "90039": { lat: 34.1, lng: -118.25 },
  "90041": { lat: 34.13, lng: -118.21 },
  "90042": { lat: 34.1, lng: -118.18 },
  "90043": { lat: 33.98, lng: -118.33 },
  "90044": { lat: 33.95, lng: -118.31 },
  "90045": { lat: 33.96, lng: -118.43 },
  "90046": { lat: 34.09, lng: -118.36 },
  "90047": { lat: 33.96, lng: -118.28 },
  "90048": { lat: 34.07, lng: -118.4 },
  "90049": { lat: 34.05, lng: -118.47 },
  "90056": { lat: 33.99, lng: -118.36 },
  "90057": { lat: 34.06, lng: -118.28 },
  "90058": { lat: 33.93, lng: -118.3 },
  "90059": { lat: 33.91, lng: -118.28 },
  "90061": { lat: 33.91, lng: -118.27 },
  "90062": { lat: 33.92, lng: -118.31 },
  "90063": { lat: 33.97, lng: -118.31 },
  "90064": { lat: 34.04, lng: -118.44 },
  "90065": { lat: 34.1, lng: -118.22 },
  "90066": { lat: 34.04, lng: -118.45 },
  "90067": { lat: 34.06, lng: -118.42 },
  "90068": { lat: 34.11, lng: -118.33 },
  "90069": { lat: 34.08, lng: -118.4 },
  "90071": { lat: 34.05, lng: -118.25 },
  "90077": { lat: 34.09, lng: -118.43 },
  "90210": { lat: 34.08, lng: -118.4 },
  "90211": { lat: 34.08, lng: -118.41 },
  "90212": { lat: 34.06, lng: -118.42 },
  "90230": { lat: 33.95, lng: -118.38 },
  "90232": { lat: 33.99, lng: -118.39 },
  "90245": { lat: 33.92, lng: -118.17 },
  "90247": { lat: 33.91, lng: -118.15 },
  "90248": { lat: 33.9, lng: -118.14 },
  "90272": { lat: 34.04, lng: -118.49 },
  "90280": { lat: 33.92, lng: -118.08 },
  "90290": { lat: 33.98, lng: -118.46 },
  "90291": { lat: 33.99, lng: -118.48 },
  "90292": { lat: 34.01, lng: -118.49 },
  "90293": { lat: 33.97, lng: -118.45 },
  "90401": { lat: 34.01, lng: -118.49 },
  "90402": { lat: 34.03, lng: -118.49 },
  "90403": { lat: 34.02, lng: -118.49 },
  "90404": { lat: 34.01, lng: -118.48 },
  "90405": { lat: 34.0, lng: -118.47 },
  "90660": { lat: 33.94, lng: -118.02 },
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8 // Radius of the earth in miles
  const φ1 = (lat1 * Math.PI) / 180 // φ, λ in radians
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  const distance = R * c
  return distance
}

/**
 * Checks if a store exists in a given ZIP code or within the specified radius
 */
export function storeExistsInZipCode(storeName: string, zipCode: string, radiusMiles = 10): boolean {
  // First check the exact ZIP code
  if (ZIP_CODE_STORE_MAP[zipCode]?.includes(storeName)) {
    return true
  }

  // If not found in exact ZIP code, check nearby ZIP codes
  const nearbyZips = findNearbyZipCodes(zipCode, radiusMiles)
  return nearbyZips.some((zip) => ZIP_CODE_STORE_MAP[zip]?.includes(storeName))
}

/**
 * Gets nearby ZIP codes that have the requested store
 */
export function getNearbyZipCodesWithStore(
  storeName: string,
  zipCode: string,
  radiusMiles = 10,
): Array<{
  zipCode: string
  distance: number
}> {
  const origin = ZIP_COORDINATES[zipCode]
  if (!origin) return []

  return Object.entries(ZIP_CODE_STORE_MAP)
    .filter(([zip, stores]) => stores.includes(storeName))
    .map(([zip]) => {
      const coords = ZIP_COORDINATES[zip]
      if (!coords) return null
      const distance = calculateDistance(origin.lat, origin.lng, coords.lat, coords.lng)
      return { zipCode: zip, distance }
    })
    .filter((item): item is { zipCode: string; distance: number } => item !== null && item.distance <= radiusMiles)
    .sort((a, b) => a.distance - b.distance)
}

