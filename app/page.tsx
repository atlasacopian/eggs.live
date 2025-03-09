import { prisma } from "@/lib/db"
import { PriceDisplay } from "@/components/price-display"
import { PriceHistoryGraph } from "@/components/price-history-graph"
import { StoreList } from "@/components/store-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Home() {
  // Get the latest average prices
  const latestRegularAvg = await prisma.averagePrice.findFirst({
    where: { eggType: "regular" },
    orderBy: { date: "desc" },
  })

  const latestOrganicAvg = await prisma.averagePrice.findFirst({
    where: { eggType: "organic" },
    orderBy: { date: "desc" },
  })

  // Get yesterday's average prices
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)

  const yesterdayRegularAvg = await prisma.averagePrice.findFirst({
    where: {
      eggType: "regular",
      date: {
        lt: latestRegularAvg?.date,
      },
    },
    orderBy: { date: "desc" },
  })

  const yesterdayOrganicAvg = await prisma.averagePrice.findFirst({
    where: {
      eggType: "organic",
      date: {
        lt: latestOrganicAvg?.date,
      },
    },
    orderBy: { date: "desc" },
  })

  // Get the latest prices for all stores
  const latestRegularPrices = await prisma.eggPrice.findMany({
    where: {
      date: latestRegularAvg?.date,
      eggType: "regular",
    },
    include: {
      store: true,
    },
    orderBy: {
      price: "asc",
    },
  })

  const latestOrganicPrices = await prisma.eggPrice.findMany({
    where: {
      date: latestOrganicAvg?.date,
      eggType: "organic",
    },
    include: {
      store: true,
    },
    orderBy: {
      price: "asc",
    },
  })

  // Get historical data for the graph
  const last30DaysRegular = await prisma.averagePrice.findMany({
    where: {
      eggType: "regular",
      date: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
    orderBy: {
      date: "asc",
    },
  })

  const last30DaysOrganic = await prisma.averagePrice.findMany({
    where: {
      eggType: "organic",
      date: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
    orderBy: {
      date: "asc",
    },
  })

  return (
    <main className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold text-center my-8">🥚 US Egg Price Tracker</h1>

      <Tabs defaultValue="regular">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="regular">Regular Eggs</TabsTrigger>
          <TabsTrigger value="organic">Organic Eggs</TabsTrigger>
        </TabsList>

        <TabsContent value="regular" className="mt-4">
          <div className="grid gap-6">
            <PriceDisplay
              currentPrice={latestRegularAvg?.price || 0}
              previousPrice={yesterdayRegularAvg?.price || 0}
              storeCount={latestRegularAvg?.storeCount || 0}
              date={latestRegularAvg?.date}
            />

            <div className="bg-black p-4 rounded-lg">
              <h2 className="text-xl font-mono text-green-400 mb-4">Price History (30 Days)</h2>
              <PriceHistoryGraph data={last30DaysRegular} />
            </div>

            <StoreList prices={latestRegularPrices} />
          </div>
        </TabsContent>

        <TabsContent value="organic" className="mt-4">
          <div className="grid gap-6">
            <PriceDisplay
              currentPrice={latestOrganicAvg?.price || 0}
              previousPrice={yesterdayOrganicAvg?.price || 0}
              storeCount={latestOrganicAvg?.storeCount || 0}
              date={latestOrganicAvg?.date}
              isOrganic={true}
            />

            <div className="bg-black p-4 rounded-lg">
              <h2 className="text-xl font-mono text-green-400 mb-4">Price History (30 Days)</h2>
              <PriceHistoryGraph data={last30DaysOrganic} />
            </div>

            <StoreList prices={latestOrganicPrices} />
          </div>
        </TabsContent>
      </Tabs>

      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Data updated daily. Prices are for a dozen eggs.</p>
        <p className="mt-2">© {new Date().getFullYear()} Egg Price Tracker</p>
      </footer>
    </main>
  )
}

