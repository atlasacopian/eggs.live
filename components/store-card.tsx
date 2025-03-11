interface StoreCardProps {
  name: string
  price: number
  website: string
}

export function StoreCard({ name, price, website }: StoreCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-2">
        <h3 className="font-medium">{name}</h3>
        <div className="font-mono text-2xl font-bold">${price.toFixed(2)}</div>
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-gray-500 hover:text-black"
        >
          Visit website
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </div>
  )
}

