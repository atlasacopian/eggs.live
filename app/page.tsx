import { EggPriceChart } from "@/components/egg-price-chart"
import { CurrentPrice } from "@/components/current-price"
import { TimeframeSelector } from "@/components/timeframe-selector"
import { StoreList } from "@/components/store-list"
import { LastUpdated } from "@/components/last-updated"
import { HistoricalComparison } from "@/components/historical-comparison"

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white font-mono uppercase">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-wider">EGG INDEX</h1>
            <p className="text-gray-400">NATIONWIDE EGG PRICE TRACKER</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <CurrentPrice />
            <LastUpdated />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-black rounded-none border border-gray-700 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-xl font-medium">PRICE HISTORY</h2>
              <TimeframeSelector />
            </div>
            <div className="h-[500px]">
              <EggPriceChart />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-black rounded-none border border-gray-700 p-4">
              <h2 className="text-xl font-medium mb-4">MAJOR RETAILERS</h2>
              <StoreList />
            </div>

            <HistoricalComparison />
          </div>
        </div>
      </div>
    </main>
  )
}

