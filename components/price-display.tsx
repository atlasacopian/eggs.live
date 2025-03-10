export function PriceDisplay({ price, label }: { price: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl font-bold">${price.toFixed(2)}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}

