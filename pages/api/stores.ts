import type { NextApiRequest, NextApiResponse } from "next"
import prisma from "@/lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get all stores with their locations
    const stores = await prisma.store.findMany({
      include: {
        store_locations: true,
      },
    })

    return res.json({
      success: true,
      stores: stores.map((store) => ({
        id: store.id,
        name: store.name,
        website: store.website,
        locationCount: store.store_locations.length,
        locations: store.store_locations.map((loc) => ({
          id: loc.id,
          address: loc.address,
          zipCode: loc.zipCode,
          latitude: loc.latitude,
          longitude: loc.longitude,
        })),
      })),
    })
  } catch (error) {
    console.error("Error fetching stores:", error)
    return res.status(500).json({
      success: false,
      error: "Failed to fetch stores",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

