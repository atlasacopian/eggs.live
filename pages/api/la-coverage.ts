import type { NextApiRequest, NextApiResponse } from "next"
import { getAllLAStoreLocations } from "@/lib/la-store-locations"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get all possible store locations
    const allPossibleLocations = getAllLAStoreLocations()

    // Get all store locations with prices
    const storeLocationsWithPrices = await prisma.la_egg_prices.findMany({
      include: { store_location: { include: { store: true } } },
    })

    // Get all chains
    const chains = Array.from(new Set(allPossibleLocations.map((loc) => loc.name)))

    // Get all zip codes
    const zipCodes = Array.from(new Set(allPossibleLocations.map((loc) => loc.zipCode)))

    // Calculate coverage
    const coverage = {
      total: {
        possible: allPossibleLocations.length,
        covered: storeLocationsWithPrices.length,
        percentage: Math.round((storeLocationsWithPrices.length / allPossibleLocations.length) * 100),
      },
      byChain: {} as Record<string, { possible: number; covered: number; percentage: number }>,
      byZipCode: {} as Record<string, { possible: number; covered: number; percentage: number }>,
    }

    // Calculate coverage by chain
    chains.forEach((chain) => {
      const possibleForChain = allPossibleLocations.filter((loc) => loc.name === chain).length
      const coveredForChain = storeLocationsWithPrices.filter((item) => item.store_location.store.name === chain).length

      coverage.byChain[chain] = {
        possible: possibleForChain,
        covered: coveredForChain,
        percentage: Math.round((coveredForChain / possibleForChain) * 100),
      }
    })

    // Calculate coverage by zip code
    zipCodes.forEach((zipCode) => {
      const possibleForZip = allPossibleLocations.filter((loc) => loc.zipCode === zipCode).length
      const coveredForZip = storeLocationsWithPrices.filter((item) => item.store_location.zipcode === zipCode).length // Changed from zipCode to zipcode

      coverage.byZipCode[zipCode] = {
        possible: possibleForZip,
        covered: coveredForZip,
        percentage: Math.round((coveredForZip / possibleForZip) * 100),
      }
    })

    return res.json({
      success: true,
      coverage,
    })
  } catch (error) {
    console.error("Error getting LA coverage:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to get LA coverage",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

