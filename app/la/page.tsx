import { LAPrices } from "@/components/la-prices"

export default function LAPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Los Angeles Egg Prices</h1>
      <p className="text-gray-600 mb-8">Track egg prices across the Los Angeles metro area</p>

      <LAPrices />
    </div>
  )
}

