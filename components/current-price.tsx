interface CurrentPriceProps {
  price: number
}

export function CurrentPrice({ price }: CurrentPriceProps) {
  return (
    <div className="font-mono">
      <div className="text-3xl font-bold tracking-tight">
        ${price.toFixed(2)}
        <span className="text-sm font-normal text-gray-500 ml-1">/dozen</span>
      </div>
    </div>
  )
}

