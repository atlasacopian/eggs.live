import { formatDate } from "@/lib/utils"

interface StoreListProps {
  prices: {
    id: string
    storeId: string
    price: number
    date: Date
    eggType: string
    store: {
      id: string
      name: string
      website: string
    }
  }[]
}

export function StoreList({ prices }: StoreListProps) {
  if (!prices || prices.length === 0) {
    return (
      <div className="bg-black p-4 rounded-lg">
        <h2 className="text-xl font-mono text-green-400 mb-4">Store Prices</h2>
        <p className="text-gray-400">No price data available</p>
      </div>
    )
  }

  return (
    <div className="bg-black p-4 rounded-lg">
      <h2 className="text-xl font-mono text-green-400 mb-4">Store Prices</h2>
      <div className="space-y-2">
        {prices.map((price) => (
          <div key={price.id} className="flex justify-between items-center border-b border-gray-800 pb-2">
            <div>
              <div className="text-white">{price.store.name}</div>
              <div className="text-xs text-gray-400">{formatDate(price.date)}</div>
            </div>
            <div className="text-xl font-mono text-green-400">${price.price.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

