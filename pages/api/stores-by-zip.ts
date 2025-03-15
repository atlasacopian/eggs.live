import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const { zipCode } = req.query

      if (!zipCode || typeof zipCode !== "string") {
        return res.status(400).json({
          success: false,
          error: "Zip code is required and must be a string",
        })
      }

      // Find store locations by zipcode (note the lowercase 'c')
      const storeLocations = await prisma.store_locations.findMany({
        where: {
          zipcode: zipCode, // Using lowercase 'c' to match the database schema
        },
        include: {
          store: true,
        },
      })

      if (storeLocations.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No stores found for this zip code",
        })
      }

      // Format the response
      const formattedStores = storeLocations.map((location) => ({
        id: location.id,
        storeId: location.store_id,
        storeName: location.store.name,
        address: location.address || "Address not available",
        zipcode: location.zipcode,
        latitude: location.latitude,
        longitude: location.longitude,
        // Removed website field
      }))

      return res.status(200).json({
        success: true,
        stores: formattedStores,
      })
    } catch (error) {
      console.error("Error fetching stores by zip:", error)
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

