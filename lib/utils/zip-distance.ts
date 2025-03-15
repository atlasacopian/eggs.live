interface ZipLocation {
  lat: number
  lng: number
}

// ZIP code coordinate data (partial list of LA area ZIP codes)
const ZIP_COORDINATES: Record<string, ZipLocation> = {
  "90026": { lat: 34.0847, lng: -118.2602 }, // Silver Lake
  "90027": { lat: 34.1016, lng: -118.2922 }, // Los Feliz
  "90039": { lat: 34.1115, lng: -118.2609 }, // Atwater Village
  "90029": { lat: 34.0886, lng: -118.2922 }, // East Hollywood
  "90004": { lat: 34.0824, lng: -118.3087 }, // Koreatown
  // Add more ZIP codes as needed
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function findNearbyZipCodes(zipCode: string, radiusMiles = 10): string[] {
  const origin = ZIP_COORDINATES[zipCode]
  if (!origin) return []

  return Object.entries(ZIP_COORDINATES)
    .filter(([zip, coords]) => {
      if (zip === zipCode) return false
      const distance = calculateDistance(origin.lat, origin.lng, coords.lat, coords.lng)
      return distance <= radiusMiles
    })
    .map(([zip]) => zip)
    .sort()
}

