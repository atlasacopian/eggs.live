import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eggType = searchParams.get("eggType") || "regular" // Default to regular eggs

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Define the historical points we want to compare
    const historicalPoints = [
      { label: "1 year ago", date: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()) },
      { label: "6 months ago", date: new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()) },
      { label: "3 months ago", date: new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()) },
      { label: "1 month ago", date: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()) },
      { label: "Today", date: today },
    ]

    // Get the closest average price for each historical point
    const historicalData = await Promise.all(
      historicalPoints.map(async (point) => {
        // Find the closest date to our target date for the specified egg type
        const closestPrice = await prisma.averagePrice.findFirst({
          where: {
            date: {
              lte: point.date,
            },
            eggType: eggType,
          },
          orderBy: {
            date: "desc",
          },
        })

        // If no data found, use null
        return {
          label: point.label,
          date: point.date.toISOString(),
          price: closestPrice?.price || null,
        }
      }),
    )

    // Calculate changes between periods
    const dataWithChanges = historicalData.map((point, index) => {
      if (index === 0 || point.price === null || historicalData[index - 1].price === null) {
        return {
          ...point,
          change: null,
          changePercent: null,
        }
      }

      const previousPrice = historicalData[index - 1].price
      const change = point.price - previousPrice
      const changePercent = (change / previousPrice) * 100

      return {
        ...point,
        change: Number.parseFloat(change.toFixed(2)),
        changePercent: Number.parseFloat(changePercent.toFixed(2)),
      }
    })

    return NextResponse.json(dataWithChanges)
  } catch (error) {
    console.error("Error fetching historical data:", error)
    return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 })
  }
}

