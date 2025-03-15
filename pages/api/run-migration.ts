import type { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  try {
    // Add the inStock column with a default value of true
    await prisma.$executeRaw`
      ALTER TABLE la_egg_prices 
      ADD COLUMN IF NOT EXISTS "inStock" BOOLEAN NOT NULL DEFAULT true
    `

    return res.status(200).json({
      success: true,
      message: "Migration completed successfully",
    })
  } catch (error) {
    console.error("Migration error:", error)
    return res.status(500).json({
      success: false,
      error: "Migration failed",
      message: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

