export function PriceDisplay({ price, change }: { price: number; change: number }) {
  const isPositive = change >= 0

  return (
    <div className="flex items-baseline gap-3">
      <div className="text-5xl font-bold">${price.toFixed(2)}</div>
      <div className={`text-lg ${isPositive ? "text-green-500" : "text-red-500"}`}>
        {isPositive ? "+" : ""}
        {change.toFixed(2)} ({isPositive ? "+" : ""}
        {((change / (price - change)) * 100).toFixed(2)}%)
      </div>
    </div>
  )
}

