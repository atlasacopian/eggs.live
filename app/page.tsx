import { EggPriceTracker } from "@/components/egg-price-tracker"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <span className="text-4xl">🥚</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">eggs.live</h1>
              <p className="text-sm text-gray-500">Real-time egg prices across the US and Echo Park, Los Angeles</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <EggPriceTracker />
      </main>

      <footer className="border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} eggs.live - All prices are for a dozen eggs
          </p>
        </div>
      </footer>
    </div>
  )
}

