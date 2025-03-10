import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Add a test store
    const store = await prisma.store.upsert({
      where: { id: "walmart-test" },
      update: {},
      create: {
        id: "walmart-test",
        name: "Walmart Test",
        website: "https://www.walmart.com"
      }
    })

    // Add some test prices
    const today = new Date()
    const price = await prisma.eggPrice.create({
      data: {
        storeId: store.id,
        price: 3.99,
        date: today,
        eggType: "regular"
      }
    })

    // Add average price
    const avgPrice = await prisma.averagePrice.create({
      data: {
        date: today,
        price: 3.99,
        storeCount: 1,
        eggType: "regular"
      }
    })

    // Add dozen price
    const dozenPrice = await prisma.dozenPrice.create({
      data: {
        date: today,
        price: 4.99,
        eggType: "regular"
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        store,
        price,
        avgPrice,
        dozenPrice
      }
    })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
