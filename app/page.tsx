import { LAPrices } from "@/components/la-prices"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-2">eggs.live</h1>
      <p className="text-xl text-gray-600 mb-4">Track egg prices across Los Angeles</p>

      <div className="flex gap-4 mb-8">
        <Link href="/api/db-check" target="_blank">
          <Button variant="outline">Check Database</Button>
        </Link>
        <Link href="/api/debug" target="_blank">
          <Button variant="outline">Debug Data</Button>
        </Link>
      </div>

      <LAPrices />
    </div>
  )
}

