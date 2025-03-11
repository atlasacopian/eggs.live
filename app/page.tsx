import { EggPriceTracker } from "@/components/egg-price-tracker"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="w-full max-w-7xl space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">🥚 eggs.live</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
            Track egg prices across the US and in Echo Park, Los Angeles
          </p>
        </div>

        <EggPriceTracker />

        <footer className="text-center text-sm text-gray-500 dark:text-gray-400 mt-12 pt-6 border-t">
          <p>© {new Date().getFullYear()} eggs.live - All prices are for a dozen eggs</p>
          <p className="mt-1">
            <a
              href="https://github.com/yourusername/eggs-live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}

