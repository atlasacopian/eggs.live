import type { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const prices = await prisma.la_egg_prices.findMany({
        orderBy: {
          date: "desc",
        },
        take: 7,
      })
      res.status(200).json(prices)
    } catch (error) {
      console.error(error)
      res.status(500).json({ error: "Failed to fetch prices" })
    } finally {
      await prisma.$disconnect()
    }
  } else {
    res.status(405).json({ error: "Method not allowed" })
  }
}

