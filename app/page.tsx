import { prisma } from "@/lib/db"

// Make this page dynamic to avoid static generation errors
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  try {
    // Ensure database connection with a timeout
    const connectPromise = prisma.$connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database connection timeout")), 5000)
    );
    
    try {
      await Promise.race([connectPromise, timeoutPromise]);
    } catch (error) {
      console.error("Database connection error:", error);
      // Return fallback UI immediately if connection fails
      return renderFallbackUI();
    }

    // Get the latest average prices with error handling
    const latestRegularAvg = await prisma.averagePrice
      .findFirst({
        where: { eggType: "regular" },
        orderBy: { date: "desc" },
      })
      .catch((e) => {
        console.error("Error fetching regular average:", e)
        return null
      });

    const latestBrownAvg = await prisma.averagePrice
      .findFirst({
        where: { eggType: "brown" },
        orderBy: { date: "desc" },
      })
      .catch((e) => {
        console.error("Error fetching brown average:", e)
        return null
      });

    const latestOrganicAvg = await prisma.averagePrice
      .findFirst({
        where: { eggType: "organic" },
        orderBy: { date: "desc" },
      })
      .catch((e) => {
        console.error("Error fetching organic average:", e)
        return null
      });

    // Get the latest dozen prices
    const latestRegularDozen = await prisma.dozenPrice
      .findFirst({
        where: { eggType: "regular" },
        orderBy: { date: "desc" },
      })
      .catch((e) => {
        console.error("Error fetching regular dozen:", e)
        return null
      });

    const latestBrownDozen = await prisma.dozenPrice
      .findFirst({
        where: { eggType: "brown" },
        orderBy: { date: "desc" },
      })
      .catch((e) => {
        console.error("Error fetching brown dozen:", e)
        return null
      });

    const latestOrganicDozen = await prisma.dozenPrice
      .findFirst({
        where: { eggType: "organic" },
        orderBy: { date: "desc" },
      })
      .catch((e) => {
        console.error("Error fetching organic dozen:", e)
        return null
      });

    // If we can't get any data, show a message but don't error
    if (!latestRegularAvg && !latestOrganicAvg && !latestBrownAvg && 
        !latestRegularDozen && !latestOrganicDozen && !latestBrownDozen) {
      return renderEmptyDataUI();
    }

    return (
      <main className="container mx-auto p-4">
        <h1 className="text-4xl font-bold text-center my-8">🥚 US Egg Price Tracker</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-black p-6 rounded-lg text-green-400 font-mono">
            <h2 className="text-xl mb-4">Average Prices</h2>
            
            {latestRegularAvg ? (
              <p className="mb-2">
                Regular: ${latestRegularAvg.price.toFixed(2)} ({formatDate(latestRegularAvg.date)})
              </p>
            ) : (
              <p className="mb-2">No regular average price data available.</p>
            )}
            
            {latestBrownAvg ? (
              <p className="mb-2">
                Brown: ${latestBrownAvg.price.toFixed(2)} ({formatDate(latestBrownAvg.date)})
              </p>
            ) : (
              <p className="mb-2">No brown average price data available.</p>
            )}
            
            {latestOrganicAvg ? (
              <p className="mb-2">
                Organic: ${latestOrganicAvg.price.toFixed(2)} ({formatDate(latestOrganicAvg.date)})
              </p>
            ) : (
              <p className="mb-2">No organic average price data available.</p>
            )}
          </div>

          <div className="bg-black p-6 rounded-lg text-green-400 font-mono">
            <h2 className="text-xl mb-4">Dozen Prices</h2>
            
            {latestRegularDozen ? (
              <p className="mb-2">
                Regular: ${latestRegularDozen.price.toFixed(2)} ({formatDate(latestRegularDozen.date)})
              </p>
            ) : (
              <p className="mb-2">No regular dozen price data available.</p>
            )}

            {latestBrownDozen ? (
              <p className="mb-2">
                Brown: ${latestBrownDozen.price.toFixed(2)} ({formatDate(latestBrownDozen.date)})
              </p>
            ) : (
              <p className="mb-2">No brown dozen price data available.</p>
            )}

            {latestOrganicDozen ? (
              <p className="mb-2">
                Organic: ${latestOrganicDozen.price.toFixed(2)} ({formatDate(latestOrganicDozen.date)})
              </p>
            ) : (
              <p className="mb-2">No organic dozen price data available.</p>
            )}
          </div>
        </div>
        
        <div className="text-center">
          <a href="/stores" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            View All Stores
          </a>
        </div>
      </main>
    );
  } catch (error) {
    console.error("Page error:", error);
    return renderFallbackUI();
  }
}

// Helper function to format dates
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

// Helper function to render fallback UI
function renderFallbackUI() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="bg-black p-6 rounded-lg text-green-400 font-mono max-w-md w-full">
        <h1 className="text-2xl mb-4">🥚 US Egg Price Tracker</h1>
        <p>Currently setting up the database connection.</p>
        <p className="text-sm mt-2">Please check back soon!</p>
        <div className="mt-4 text-xs">
          <p>Status: Database connection in progress</p>
        </div>
      </div>
    </main>
  );
}

// Helper function to render empty data UI
function renderEmptyDataUI() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="bg-black p-6 rounded-lg text-green-400 font-mono max-w-md w-full">
        <h1 className="text-2xl mb-4">🥚 US Egg Price Tracker</h1>
        <p>No egg price data is available yet.</p>
        <p className="text-sm mt-2">We're working on collecting the latest prices.</p>
        <div className="mt-4">
          <a href="/test" className="text-blue-400 hover:underline">Check Database Status</a>
        </div>
      </div>
    </main>
  );
}
