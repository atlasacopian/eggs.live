import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { zipCode, includeOutOfStock = "false" } = req.query

    console.log("Received request for ZIP:", zipCode)

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // First, let's check if we have any store locations for this ZIP code
    // Removed timestamp fields from the query
    const storeLocations = await prisma.store_locations.findMany({
      where: {
        zipcode: zipCode as string,
      },
      select: {
        id: true,
        store_id: true,
        address: true,
        zipcode: true,
        latitude: true,
        longitude: true,
        store: {
          select: {
            id: true,
            name: true,
            website: true,
          },
        },
      },
    })

    console.log(`Found ${storeLocations.length} store locations for ZIP ${zipCode}`)

    if (storeLocations.length === 0) {
      return res.json({
        success: true,
        zipCode,
        message: `No stores found in ZIP code ${zipCode}`,
        cheapestRegular: [],
        cheapestOrganic: [],
        outOfStock: [],
        showingOutOfStock: includeOutOfStock === "true",
      })
    }

    // Get store location IDs
    const storeLocationIds = storeLocations.map((loc) => loc.id)
    console.log("Store location IDs:", storeLocationIds)

    // Base query conditions
    const baseWhere: any = {
      date: {
        gte: today,
      },
      price: {
        gt: 0,
      },
      store_location_id: {
        in: storeLocationIds,
      },
    }

    if (includeOutOfStock !== "true") {
      baseWhere["inStock"] = true
    }

    // Find cheapest regular eggs
    const cheapestRegular = await prisma.la_egg_prices.findMany({
      where: {
        ...baseWhere,
        eggType: "regular",
      },
      orderBy: {
        price: "asc",
      },
      select: {
        id: true,
        price: true,
        date: true,
        inStock: true,
        store_location_id: true,
        store_location: {
          select: {
            address: true,
            zipcode: true,
            store: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: 5,
    })

    console.log(`Found ${cheapestRegular.length} regular egg prices`)

    // Find cheapest organic eggs
    const cheapestOrganic = await prisma.la_egg_prices.findMany({
      where: {
        ...baseWhere,
        eggType: "organic",
      },
      orderBy: {
        price: "asc",
      },
      select: {
        id: true,
        price: true,
        date: true,
        inStock: true,
        store_location_id: true,
        store_location: {
          select: {
            address: true,
            zipcode: true,
            store: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: 5,
    })

    console.log(`Found ${cheapestOrganic.length} organic egg prices`)

    // Format the results
    const formatResults = (results: any[]) =>
      results.map((item) => ({
        price: item.price,
        storeName: item.store_location.store.name,
        address: item.store_location.address || "Address not available",
        zipCode: item.store_location.zipcode,
        date: item.date,
        id: item.id,
        storeLocationId: item.store_location_id,
        inStock: item.inStock,
      }))

    // Get out of stock items
    let outOfStockItems = []
    if (includeOutOfStock !== "true") {
      const outOfStock = await prisma.la_egg_prices.findMany({
        where: {
          store_location_id: {
            in: storeLocationIds,
          },
          date: {
            gte: today,
          },
          inStock: false,
        },
        select: {
          id: true,
          price: true,
          date: true,
          inStock: true,
          store_location_id: true,
          store_location: {
            select: {
              address: true,
              zipcode: true,
              store: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: 10,
      })

      console.log(`Found ${outOfStock.length} out of stock items`)
      outOfStockItems = formatResults(outOfStock)
    }

    return res.json({
      success: true,
      zipCode: zipCode || "all",
      date: today.toISOString(),
      cheapestRegular: formatResults(cheapestRegular),
      cheapestOrganic: formatResults(cheapestOrganic),
      outOfStock: outOfStockItems,
      showingOutOfStock: includeOutOfStock === "true",
    })
  } catch (error) {
    console.error("Error finding cheapest eggs:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to find cheapest eggs",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

