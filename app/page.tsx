import { EggPriceTracker } from "@/components/egg-price-tracker"

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-6xl">🥚</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">eggs.live</h1>
          <p className="text-gray-600">Real-time egg prices across the US and Echo Park, Los Angeles</p>
        </div>

        <EggPriceTracker />

        <footer className="mt-16 pt-8 border-t text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} eggs.live - All prices are for a dozen eggs</p>
          <p className="mt-2">
            <a
              href="https://github.com/yourusername/eggs-live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:underline"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}

