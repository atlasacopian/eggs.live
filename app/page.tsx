import Link from "next/link"
import { PriceDisplay } from "@/components/price-display"
import { PriceChart } from "@/components/price-chart"

async function getStores() {
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

// Mock historical data for the chart
const getHistoricalData = () => {
  const today = new Date()
  const data = []

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Generate some realistic price fluctuations
    const regularPrice = 3.5 + Math.sin(i / 5) * 0.5 + Math.random() * 0.2
    const organicPrice = 5.99 + Math.sin(i / 5) * 0.7 + Math.random() * 0.3

    data.push({
      date: date.toISOString().split("T")[0],
      regular: regularPrice.toFixed(2),
      organic: organicPrice.toFixed(2),
    })
  }

  return data
}

export default async function Home() {
  const stores = await getStores()
  const prices = await getPrices()
  const historicalData = getHistoricalData()

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
    <main className="min-h-screen bg-black text-[#00FF00] p-4 md:p-8 font-mono antialiased">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold [text-shadow:_0_0_10px] flex items-center gap-3">🥚 Egg Price Tracker</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-2">
            <h2 className="text-2xl [text-shadow:_0_0_5px]">Today's Average Egg Price</h2>
            <PriceDisplay price={avgRegularPrice} change={0.12} />
            <div className="text-xl">Regular Eggs</div>
            <div className="text-sm opacity-80">Based on {regularPrices.length} stores</div>
          </section>

          <section className="space-y-2">
            <h2 className="text-2xl [text-shadow:_0_0_5px]">Today's Average Organic Egg Price</h2>
            <PriceDisplay price={avgOrganicPrice} change={-0.08} />
            <div className="text-xl">Organic Eggs</div>
            <div className="text-sm opacity-80">Based on {organicPrices.length} stores</div>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-2xl [text-shadow:_0_0_5px] mb-4">Price History (30 Days)</h2>
          <div className="h-[300px] w-full">
            <PriceChart data={historicalData} />
          </div>
        </section>

        <section className="mt-8 space-y-4">
          <h2 className="text-2xl [text-shadow:_0_0_5px]">Today's Prices by Store</h2>

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
                    className="border border-[#00FF00]/30 p-4 hover:bg-[#00FF00]/10 transition-colors"
                  >
                    <h3 className="text-xl mb-2">{store.name}</h3>
                    {regularPrice && <div>Regular: ${Number.parseFloat(regularPrice.price).toFixed(2)}</div>}
                    {organicPrice && <div>Organic: ${Number.parseFloat(organicPrice.price).toFixed(2)}</div>}
                    {!regularPrice && !organicPrice && <div>No price data available</div>}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div>No store data available. Please run the scraper.</div>
          )}
        </section>

        <div className="mt-6">
          <Link
            href="/stores"
            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors inline-block"
          >
            View All Stores
          </Link>
        </div>
      </div>
    </main>
  )
}

