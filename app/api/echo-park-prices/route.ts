import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eggType = searchParams.get("eggType") || "regular"

    // Get the current date in YYYY-MM-DD format
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Query for today's prices in Echo Park
    const prices = await prisma.echo_park_egg_prices.findMany({
      where: {
        date: {
          gte: today,
        },
        price: {
          gt: 0, // Ensure we only get valid prices
        },
        eggType: eggType,
      },
      include: {
        store_location: {
          include: {
            store: true,
          },
        },
      },
      orderBy: {
        price: "asc", // Sort by price ascending
      },
    })

    // Format the response
    const stores = prices.map((price) => ({
      id: price.store_location.store.id,
      name: price.store_location.store.name,
      price: price.price,
      date: price.date.toISOString(),
      address: price.store_location.address,
    }))

    return NextResponse.json({ stores })
  } catch (error) {
    console.error("Error fetching Echo Park prices:", error)
    return NextResponse.json({ error: "Failed to fetch Echo Park prices" }, { status: 500 })
  }
}

