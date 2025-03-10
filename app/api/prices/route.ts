import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    // Get today's date at midnight
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch all prices for today
    const prices = await prisma.eggPrice.findMany({
      where: {
        date: today,
      },
      include: {
        store: true,
      },
      orderBy: {
        storeId: "asc",
      },
    })

    return NextResponse.json({
      success: true,
      prices,
    })
  } catch (error) {
    console.error("Error fetching prices:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch prices",
      },
      { status: 500 },
    )
  }
}

