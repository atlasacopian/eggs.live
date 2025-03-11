"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PriceHistoryData {
  date: string
  price: number
  storeCount: number
}

export default function PriceHistory({ eggType = "regular" }: { eggType?: "regular" | "organic" }) {
  const [history, setHistory] = useState<PriceHistoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true)
        const response = await fetch(`/api/historical-prices?eggType=${eggType}`)

        if (!response.ok) {
          throw new Error("Failed to fetch price history")
        }

        const data = await response.json()
        setHistory(data.history || [])
      } catch (err) {
        console.error("Error fetching price history:", err)
        setError("Failed to load price history")
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [eggType])

  if (loading) return <p>Loading price history...</p>
  if (error) return <p className="text-red-500">{error}</p>
  if (history.length === 0) return <p>No price history available.</p>

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Price History</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stores</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                <TableCell>${item.price.toFixed(2)}</TableCell>
                <TableCell>{item.storeCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

