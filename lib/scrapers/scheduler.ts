import { prisma } from "../db";
import { scrapeEggPrices } from "../scrapers";

// Function to run the daily scraping
export async function scheduleDailyScraping() {
  try {
    console.log("Starting daily egg price scraping...");
    
    // Run the scraper
    const results = await scrapeEggPrices();
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate and save average prices
    for (const eggType of ["regular", "organic"]) {
      const prices = await prisma.eggPrice.findMany({
        where: {
          date: today,
          eggType,
        },
      });
      
      if (prices.length > 0) {
        const totalPrice = prices.reduce((sum, price) => sum + price.price, 0);
        const averagePrice = totalPrice / prices.length;
        
        await prisma.averagePrice.upsert({
          where: {
            date_eggType: {
              date: today,
              eggType,
            },
          },
          update: {
            price: averagePrice,
            storeCount: prices.length,
          },
          create: {
            date: today,
            eggType,
            price: averagePrice,
            storeCount: prices.length,
          },
        });
      }
    }

    console.log("Daily scraping completed successfully");
    return { success: true, message: "Daily scraping completed" };
  } catch (error) {
    console.error("Error in daily scraping:", error);
    throw error;
  }
}
