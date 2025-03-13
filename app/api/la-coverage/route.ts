import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAllLAStoreLocations } from "@/lib/la-store-locations"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    // Get the current date in YYYY-MM-DD format
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get all potential LA store locations
    const allPossibleLocations = getAllLAStoreLocations()

    // Get all chains
    const chains = [...new Set(allPossibleLocations.map((loc) => loc.name))]

    // Get all zip codes
    const zipCodes = [...new Set(allPossibleLocations.map((loc) => loc.zipCode))]

    // Query for today's LA prices to see what we've actually scraped
    const scrapedLocations = await prisma.la_egg_prices.findMany({
      where: {
        date: {
          gte: today,
        },
        price: {
          gt: 0, // Ensure we only get valid prices
        },
      },
      include: {
        store_location: {
          include: {
            store: true,
          },
        },
      },
      distinct: ["store_location_id", "eggType"],
    })

    // Group by chain and zip code
    const scrapedByChain: Record<string, Set<string>> = {}

    scrapedLocations.forEach((loc) => {
      const chainName = loc.store_location.store.name
      const zipCode = loc.store_location.zipCode

      if (!scrapedByChain[chainName]) {
        scrapedByChain[chainName] = new Set()
      }

      scrapedByChain[chainName].add(zipCode)
    })

    // Calculate coverage statistics
    const chainCoverage = chains.map((chain) => {
      const possibleLocations = allPossibleLocations.filter((loc) => loc.name === chain)
      const scrapedZipCodes = scrapedByChain[chain] || new Set()

      return {
        chain,
        possibleLocations: possibleLocations.length,
        scrapedLocations: scrapedZipCodes.size,
        coverage:
          possibleLocations.length > 0 ? Math.round((scrapedZipCodes.size / possibleLocations.length) * 100) : 0,
        scrapedZipCodes: Array.from(scrapedZipCodes),
      }
    })

    // Calculate overall coverage
    const totalPossible = allPossibleLocations.length
    const totalScraped = scrapedLocations.length
    const overallCoverage = totalPossible > 0 ? Math.round((totalScraped / totalPossible) * 100) : 0

    return NextResponse.json({
      success: true,
      date: today.toISOString(),
      totalPossibleLocations: totalPossible,
      totalScrapedLocations: totalScraped,
      overallCoverage,
      chainCoverage,
      totalChains: chains.length,
      totalZipCodes: zipCodes.length,
    })
  } catch (error) {
    console.error("Error fetching LA coverage:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch LA coverage statistics",
        message: error.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

