import { formatDate } from "@/lib/utils"

interface PriceDisplayProps {
  currentPrice: number
  previousPrice: number
  storeCount: number
  date?: Date | null
  isOrganic?: boolean
}

export function PriceDisplay({ currentPrice, previousPrice, storeCount, date, isOrganic = false }: PriceDisplayProps) {
  const priceDiff = currentPrice - previousPrice
  const percentChange = (priceDiff / previousPrice) * 100

  return (
    <div className="bg-black p-4 rounded-lg">
      <div className="font-mono">
        <h2 className="text-xl text-green-400 mb-4">Average {isOrganic ? "Organic " : ""}Egg Price</h2>
        <div className="text-4xl text-green-400 mb-2">${currentPrice.toFixed(2)}</div>
        <div className={`text-sm ${priceDiff >= 0 ? "text-red-400" : "text-green-400"}`}>
          {priceDiff >= 0 ? "↑" : "↓"} ${Math.abs(priceDiff).toFixed(2)} ({percentChange.toFixed(1)}%)
        </div>
        <div className="text-gray-400 text-sm mt-4">
          Based on {storeCount} stores • {date ? formatDate(date) : "Today"}
        </div>
      </div>
    </div>
  )
}
