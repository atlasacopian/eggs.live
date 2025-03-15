import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      // Get all stores with their locations
      const stores = await prisma.store.findMany({
        include: {
          store_locations: true,
        },
      })

      // Format the response
      const formattedStores = stores.map((store) => ({
        id: store.id,
        name: store.name,
        website: store.website,
        locations: store.store_locations.map((loc) => ({
          id: loc.id,
          address: loc.address,
          zipcode: loc.zipcode, // Changed from zipCode to zipcode
          latitude: loc.latitude,
          longitude: loc.longitude,
        })),
      }))

      return res.status(200).json({
        success: true,
        stores: formattedStores,
      })
    } catch (error) {
      console.error("Error fetching stores:", error)
      return res.status(500).json({
        success: false,
        error: "Failed to fetch stores",
        message: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      await prisma.$disconnect()
    }
  } else {
    res.status(405).json({ error: "Method not allowed" })
  }
}

