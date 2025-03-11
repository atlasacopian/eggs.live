interface CurrentPriceProps {
  price: number
}

export function CurrentPrice({ price }: CurrentPriceProps) {
  return (
    <div className="text-3xl font-bold">
      ${price.toFixed(2)}
      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">/dozen</span>
    </div>
  )
}

