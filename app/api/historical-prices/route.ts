import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eggType = searchParams.get("eggType") || "regular"

    // Get daily averages for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Query for daily averages
    const dailyPrices = await prisma.$queryRaw`
      SELECT 
        DATE(date) as day,
        AVG(price) as avg_price,
        COUNT(DISTINCT store_id) as store_count
      FROM egg_prices
      WHERE 
        date >= ${thirtyDaysAgo} AND
        price > 0 AND
        "eggType" = ${eggType}
      GROUP BY DATE(date)
      ORDER BY day DESC
      LIMIT 30
    `

    // Format the response
    const history = (dailyPrices as any[]).map((day) => ({
      date: day.day,
      price: Number.parseFloat(day.avg_price),
      storeCount: Number.parseInt(day.store_count),
    }))

    return NextResponse.json({ history })
  } catch (error) {
    console.error("Error fetching historical prices:", error)
    return NextResponse.json({ error: "Failed to fetch historical prices" }, { status: 500 })
  }
}

