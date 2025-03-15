import type { NextApiRequest, NextApiResponse } from "next"
import { stores } from "../../data"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { zipCode } = req.query

    if (!zipCode) {
      return res.status(400).json({ message: "Zip code is required" })
    }

    if (typeof zipCode !== "string") {
      return res.status(400).json({ message: "Zip code must be a string" })
    }

    const filteredStores = stores.filter((store) => store.address.zip.toString() === zipCode)

    if (filteredStores.length === 0) {
      return res.status(404).json({ message: "No stores found for this zip code" })
    }

    const response = filteredStores.map((store) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      phone: store.phone,
      websiteUrl: store.websiteUrl,
      imageUrl: store.imageUrl,
      zipcode: zipCode,
    }))

    res.status(200).json(response)
  } else {
    res.status(405).json({ message: "Method Not Allowed" })
  }
}

