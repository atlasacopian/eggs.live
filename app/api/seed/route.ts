import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Add multiple stores
    const stores = await Promise.all([
      prisma.store.upsert({
        where: { id: "walmart" },
        update: {},
        create: {
          id: "walmart",
          name: "Walmart",
          website: "https://www.walmart.com"
        }
      }),
      prisma.store.upsert({
        where: { id: "kroger" },
        update: {},
        create: {
          id: "kroger",
          name: "Kroger",
          website: "https://www.kroger.com"
        }
      }),
      prisma.store.upsert({
        where: { id: "target" },
        update: {},
        create: {
          id: "target",
          name: "Target",
          website: "https://www.target.com"
        }
      }),
      prisma.store.upsert({
        where: { id: "food4less" },
        update: {},
        create: {
          id: "food4less",
          name: "Food 4 Less",
          website: "https://www.food4less.com"
        }
      }),
      prisma.store.upsert({
        where: { id: "albertsons" },
        update: {},
        create: {
          id: "albertsons",
          name: "Albertsons",
          website: "https://www.albertsons.com"
        }
      })
    ])

    // Add egg prices for each store
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const eggPrices = []
    
    // Add prices for each store and egg type
    for (const store of stores) {
      // Regular eggs
      eggPrices.push(
        await prisma.eggPrice.upsert({
          where: {
            storeId_date_eggType: {
              storeId: store.id,
              date: today,
              eggType: "regular"
            }
          },
          update: {},
          create: {
            storeId: store.id,
            price: 3.49 + Math.random() * 1.5, // Random price between $3.49 and $4.99
            date: today,
            eggType: "regular"
          }
        })
      )
      
      // Brown eggs
      eggPrices.push(
        await prisma.eggPrice.upsert({
          where: {
            storeId_date_eggType: {
              storeId: store.id,
              date: today,
              eggType: "brown"
            }
          },
          update: {},
          create: {
            storeId: store.id,
            price: 4.29 + Math.random() * 1.5, // Random price between $4.29 and $5.79
            date: today,
            eggType: "brown"
          }
        })
      )
      
      // Organic eggs
      eggPrices.push(
        await prisma.eggPrice.upsert({
          where: {
            storeId_date_eggType: {
              storeId: store.id,
              date: today,
              eggType: "organic"
            }
          },
          update: {},
          create: {
            storeId: store.id,
            price: 5.99 + Math.random() * 2, // Random price between $5.99 and $7.99
            date: today,
            eggType: "organic"
          }
        })
      )
    }

    // Calculate and add average prices
    const regularPrices = eggPrices.filter(p => p.eggType === "regular")
    const brownPrices = eggPrices.filter(p => p.eggType === "brown")
    const organicPrices = eggPrices.filter(p => p.eggType === "organic")
    
    const regularAvg = regularPrices.reduce((sum, p) => sum + p.price, 0) / regularPrices.length
    const brownAvg = brownPrices.reduce((sum, p) => sum + p.price, 0) / brownPrices.length
    const organicAvg = organicPrices.reduce((sum, p) => sum + p.price, 0) / organicPrices.length
    
    const averagePrices = await Promise.all([
      prisma.averagePrice.upsert({
        where: {
          date_eggType: {
            date: today,
            eggType: "regular"
          }
        },
        update: {},
        create: {
          date: today,
          price: parseFloat(regularAvg.toFixed(2)),
          storeCount: regularPrices.length,
          eggType: "regular"
        }
      }),
      prisma.averagePrice.upsert({
        where: {
          date_eggType: {
            date: today,
            eggType: "brown"
          }
        },
        update: {},
        create: {
          date: today,
          price: parseFloat(brownAvg.toFixed(2)),
          storeCount: brownPrices.length,
          eggType: "brown"
        }
      }),
      prisma.averagePrice.upsert({
        where: {
          date_eggType: {
            date: today,
            eggType: "organic"
          }
        },
        update: {},
        create: {
          date: today,
          price: parseFloat(organicAvg.toFixed(2)),
          storeCount: organicPrices.length,
          eggType: "organic"
        }
      })
    ])

    // Add dozen prices
    const dozenPrices = await Promise.all([
      prisma.dozenPrice.upsert({
        where: {
          date_eggType: {
            date: today,
            eggType: "regular"
          }
        },
        update: {},
        create: {
          date: today,
          price: 4.29,
          eggType: "regular"
        }
      }),
      prisma.dozenPrice.upsert({
        where: {
          date_eggType: {
            date: today,
            eggType: "brown"
          }
        },
        update: {},
        create: {
          date: today,
          price: 5.49,
          eggType: "brown"
        }
      }),
      prisma.dozenPrice.upsert({
        where: {
          date_eggType: {
            date: today,
            eggType: "organic"
          }
        },
        update: {},
        create: {
          date: today,
          price: 6.99,
          eggType: "organic"
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        stores,
        eggPrices,
        averagePrices,
        dozenPrices
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
