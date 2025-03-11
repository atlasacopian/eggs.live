import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eggType = searchParams.get("eggType") || "regular"

    // Get the current date in YYYY-MM-DD format
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Query for today's prices with store information
    const prices = await prisma.egg_prices.findMany({
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
        store: true,
      },
      orderBy: {
        price: "asc", // Sort by price ascending
      },
    })

    // Format the response
    const stores = prices.map((price) => ({
      id: price.store.id,
      name: price.store.name,
      price: price.price,
      date: price.date.toISOString(),
    }))

    return NextResponse.json({ stores })
  } catch (error) {
    console.error("Error fetching stores:", error)
    return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 })
  }
}

