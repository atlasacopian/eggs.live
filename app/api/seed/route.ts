import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

export async function GET() {
  // Create a new PrismaClient instance for this request to avoid prepared statement conflicts
  const prisma = new PrismaClient()

  try {
    console.log("Starting database seeding...")

    // Create stores with upsert operations
    const stores = [
      { id: "walmart", name: "Walmart", website: "https://www.walmart.com" },
      { id: "kroger", name: "Kroger", website: "https://www.kroger.com" },
      { id: "target", name: "Target", website: "https://www.target.com" },
      { id: "food4less", name: "Food 4 Less", website: "https://www.food4less.com" },
    ]

    // Process stores one by one to avoid batch issues
    const results = []
    for (const store of stores) {
      try {
        const result = await prisma.store.upsert({
          where: { id: store.id },
          update: { name: store.name, website: store.website },
          create: store,
        })
        results.push({ store: store.id, status: "success", data: result })
      } catch (storeError) {
        console.error(`Error upserting store ${store.id}:`, storeError)
        results.push({
          store: store.id,
          status: "error",
          error: storeError instanceof Error ? storeError.message : String(storeError),
        })
      }
    }

    // Add some sample data for testing if needed
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Sample egg prices for today
    const samplePrices = [
      { storeId: "walmart", price: 3.49, date: today, eggType: "regular" },
      { storeId: "walmart", price: 5.99, date: today, eggType: "organic" },
      { storeId: "kroger", price: 3.79, date: today, eggType: "regular" },
      { storeId: "kroger", price: 6.29, date: today, eggType: "organic" },
      { storeId: "target", price: 3.99, date: today, eggType: "regular" },
      { storeId: "target", price: 6.49, date: today, eggType: "organic" },
      { storeId: "food4less", price: 3.29, date: today, eggType: "regular" },
      { storeId: "food4less", price: 5.79, date: today, eggType: "organic" },
    ]

    // Add sample prices
    const priceResults = []
    for (const price of samplePrices) {
      try {
        const result = await prisma.eggPrice.upsert({
          where: {
            storeId_date_eggType: {
              storeId: price.storeId,
              date: price.date,
              eggType: price.eggType,
            },
          },
          update: { price: price.price },
          create: price,
        })
        priceResults.push({ price: `${price.storeId}-${price.eggType}`, status: "success" })
      } catch (priceError) {
        console.error(`Error upserting price for ${price.storeId} (${price.eggType}):`, priceError)
        priceResults.push({
          price: `${price.storeId}-${price.eggType}`,
          status: "error",
          error: priceError instanceof Error ? priceError.message : String(priceError),
        })
      }
    }

    // Calculate and store average prices
    const eggTypes = ["regular", "organic"]
    const avgResults = []

    for (const eggType of eggTypes) {
      try {
        // Get all prices for this egg type today
        const prices = await prisma.eggPrice.findMany({
          where: {
            date: today,
            eggType: eggType,
          },
        })

        if (prices.length > 0) {
          // Calculate average
          const sum = prices.reduce((acc, curr) => acc + curr.price, 0)
          const avg = sum / prices.length

          // Store average
          const avgResult = await prisma.averagePrice.upsert({
            where: {
              date_eggType: {
                date: today,
                eggType: eggType,
              },
            },
            update: {
              price: avg,
              storeCount: prices.length,
            },
            create: {
              date: today,
              price: avg,
              storeCount: prices.length,
              eggType: eggType,
            },
          })

          avgResults.push({ type: eggType, status: "success", avg: avg })
        } else {
          avgResults.push({ type: eggType, status: "skipped", reason: "No prices found" })
        }
      } catch (avgError) {
        console.error(`Error calculating average for ${eggType}:`, avgError)
        avgResults.push({
          type: eggType,
          status: "error",
          error: avgError instanceof Error ? avgError.message : String(avgError),
        })
      }
    }

    const response = {
      success: true,
      message: "Database seeded successfully",
      results: {
        stores: results,
        prices: priceResults,
        averages: avgResults,
      },
    }

    // Disconnect the Prisma client to clean up connections
    await prisma.$disconnect()

    return NextResponse.json(response)
  } catch (error) {
    console.error("Seed error:", error)

    // Make sure to disconnect even on error
    await prisma.$disconnect()

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

