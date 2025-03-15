"use client"
import { useRouter } from "next/router"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CheapestEggs } from "@/components/cheapest-eggs"

export default function ResultsPage() {
  const router = useRouter()
  const { zipCode } = router.query

  if (!zipCode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center mb-6 text-black hover:underline">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to search
      </Link>

      <h1 className="text-3xl font-bold mb-2 text-center">Egg Prices Near {zipCode}</h1>
      <p className="text-gray-600 mb-8 text-center">Showing the cheapest eggs in your area</p>

      <div className="max-w-4xl mx-auto">
        <CheapestEggs initialZipCode={zipCode as string} />
      </div>
    </div>
  )
}

