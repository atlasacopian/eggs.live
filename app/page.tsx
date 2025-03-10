import { PriceDisplay } from "@/components/price-display"
import Link from "next/link"

async function getStores() {
  // Use server-side fetch to get stores data
  try {
    const response = await fetch(
      `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/stores`,
      { cache: "no-store" },
    )
    if (!response.ok) throw new Error("Failed to fetch stores")
    const data = await response.json()
    return data.success ? data.stores : []
  } catch (error) {
    console.error("Error fetching stores:", error)
    return []
  }
}

async function getPrices() {
  // Use server-side fetch to get prices data
  try {
    const response = await fetch(
      `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"}/api/prices`,
      { cache: "no-store" },
    )
    if (!response.ok) throw new Error("Failed to fetch prices")
    const data = await response.json()
    return data.success ? data.prices : []
  } catch (error) {
    console.error("Error fetching prices:", error)
    return []
  }
}

export default async function Home() {
  const stores = await getStores()
  const prices = await getPrices()

  // Calculate average prices for regular and organic eggs
  const regularPrices = prices.filter((price) => price.eggType === "regular")
  const organicPrices = prices.filter((price) => price.eggType === "organic")

  const avgRegularPrice =
    regularPrices.length > 0
      ? regularPrices.reduce((sum, price) => sum + Number.parseFloat(price.price), 0) / regularPrices.length
      : 0

  const avgOrganicPrice =
    organicPrices.length > 0
      ? organicPrices.reduce((sum, price) => sum + Number.parseFloat(price.price), 0) / organicPrices.length
      : 0

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold mb-8 text-center">🥚 Egg Price Tracker</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-black text-green-400 p-6 rounded-lg font-mono">
            <h2 className="text-xl mb-4">Today's Average Egg Price</h2>
            <PriceDisplay price={avgRegularPrice} label="Regular Eggs" />
            <p className="text-sm mt-2">Based on {regularPrices.length} stores</p>
          </div>

          <div className="bg-black text-green-400 p-6 rounded-lg font-mono">
            <h2 className="text-xl mb-4">Today's Average Organic Egg Price</h2>
            <PriceDisplay price={avgOrganicPrice} label="Organic Eggs" />
            <p className="text-sm mt-2">Based on {organicPrices.length} stores</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Today's Prices by Store</h2>

          {stores.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {stores.map((store) => {
                const storePrices = prices.filter((price) => price.storeId === store.id)
                const regularPrice = storePrices.find((price) => price.eggType === "regular")
                const organicPrice = storePrices.find((price) => price.eggType === "organic")

                return (
                  <Link
                    key={store.id}
                    href={`/stores/${store.id}`}
                    className="bg-black text-green-400 p-4 rounded-lg font-mono hover:bg-gray-900 transition-colors"
                  >
                    <h3 className="text-lg font-bold mb-2">{store.name}</h3>
                    {regularPrice && <p>Regular: ${Number.parseFloat(regularPrice.price).toFixed(2)}</p>}
                    {organicPrice && <p>Organic: ${Number.parseFloat(organicPrice.price).toFixed(2)}</p>}
                    {!regularPrice && !organicPrice && <p>No price data available</p>}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-black text-green-400 p-6 rounded-lg font-mono">
              <p>No store data available. Please run the scraper.</p>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/stores"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Stores
          </Link>
        </div>
      </div>
    </main>
  )
}

