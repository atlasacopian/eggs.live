interface CurrentPriceProps {
  price: number
}

export function CurrentPrice({ price }: CurrentPriceProps) {
  return (
    <div className="font-mono">
      <span className="text-4xl font-bold tracking-tight">${price.toFixed(2)}</span>
      <span className="text-sm text-gray-500 ml-1">/dozen</span>
    </div>
  )
}

