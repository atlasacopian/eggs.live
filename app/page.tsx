import { prisma } from "@/lib/db"

// Make this page dynamic to avoid static generation errors
export const dynamic = 'force-dynamic';

export default async function Home() {
try {
  // Ensure database connection
  await prisma.$connect()

  // Get the latest average prices with error handling
  const latestRegularAvg = await prisma.averagePrice
    .findFirst({
      where: { eggType: "regular" },
      orderBy: { date: "desc" },
    })
    .catch((e) => {
      console.error("Error fetching regular average:", e)
      return null
    })

  const latestBrownAvg = await prisma.averagePrice
    .findFirst({
      where: { eggType: "brown" },
      orderBy: { date: "desc" },
    })
    .catch((e) => {
      console.error("Error fetching brown average:", e)
      return null
    })

  const latestOrganicAvg = await prisma.averagePrice
    .findFirst({
      where: { eggType: "organic" },
      orderBy: { date: "desc" },
    })
    .catch((e) => {
      console.error("Error fetching organic average:", e)
      return null
    })

  // Get the latest dozen prices
  const latestRegularDozen = await prisma.dozenPrice
    .findFirst({
      where: { eggType: "regular" },
      orderBy: { date: "desc" },
    })
    .catch((e) => {
      console.error("Error fetching regular dozen:", e)
      return null
    })

  const latestBrownDozen = await prisma.dozenPrice
    .findFirst({
      where: { eggType: "brown" },
      orderBy: { date: "desc" },
    })
    .catch((e) => {
      console.error("Error fetching brown dozen:", e)
      return null
    })

  const latestOrganicDozen = await prisma.dozenPrice
    .findFirst({
      where: { eggType: "organic" },
      orderBy: { date: "desc" },
    })
    .catch((e) => {
      console.error("Error fetching organic dozen:", e)
      return null
    })

  // Always return a fallback UI to prevent build failures
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center my-8">🥚 US Egg Price Tracker</h1>
      
      {latestRegularAvg ? (
        <p>
          Latest Regular Average: ${latestRegularAvg.price} ({latestRegularAvg.date.toLocaleDateString()})
        </p>
      ) : (
        <p>No regular average price data available.</p>
      )}
      
      {latestBrownAvg ? (
        <p>
          Latest Brown Average: ${latestBrownAvg.price} ({latestBrownAvg.date.toLocaleDateString()})
        </p>
      ) : (
        <p>No brown average price data available.</p>
      )}
      
      {latestOrganicAvg ? (
        <p>
          Latest Organic Average: ${latestOrganicAvg.price} ({latestOrganicAvg.date.toLocaleDateString()})
        </p>
      ) : (
        <p>No organic average price data available.</p>
      )}

      {latestRegularDozen ? (
        <p>
          Latest Regular Dozen: ${latestRegularDozen.price} ({latestRegularDozen.date.toLocaleDateString()})
        </p>
      ) : (
        <p>No regular dozen price data available.</p>
      )}

      {latestBrownDozen ? (
        <p>
          Latest Brown Dozen: ${latestBrownDozen.price} ({latestBrownDozen.date.toLocaleDateString()})
        </p>
      ) : (
        <p>No brown dozen price data available.</p>
      )}

      {latestOrganicDozen ? (
        <p>
          Latest Organic Dozen: ${latestOrganicDozen.price} ({latestOrganicDozen.date.toLocaleDateString()})
        </p>
      ) : (
        <p>No organic dozen price data available.</p>
      )}
    </main>
  )
} catch (error) {
  console.error("Page error:", error)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="bg-black p-6 rounded-lg text-green-400 font-mono">
        <h1 className="text-2xl mb-4">🥚 US Egg Price Tracker</h1>
        <p>Currently setting up the database.</p>
        <p className="text-sm mt-2">Please check back soon!</p>
      </div>
    </main>
  )
}
}
