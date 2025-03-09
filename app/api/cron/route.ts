import { NextResponse } from "next/server"
import { scrapeEggPrices } from "@/lib/scrapers"
import { prisma } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("key")

    // Verify API key
    if (apiKey !== process.env.SCRAPER_API_KEY_2) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Run the scraper
    const results = await scrapeEggPrices()
    
    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Calculate and save average prices
    for (const eggType of ["regular", "organic"]) {
      const prices = await prisma.eggPrice.findMany({
        where: {
          date: today,
          eggType,
        },
      })
      
      if (prices.length > 0) {
        const totalPrice = prices.reduce((sum, price) => sum + price.price, 0)
        const averagePrice = totalPrice / prices.length
        
        await prisma.averagePrice.upsert({
          where: {
            date_eggType: {
              date: today,
              eggType,
            },
          },
          update: {
            price: averagePrice,
            storeCount: prices.length,
          },
          create: {
            date: today,
            eggType,
            price: averagePrice,
            storeCount: prices.length,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cron job completed successfully",
      results,
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to run cron job",
      },
      { status: 500 }
    )
  }
}
