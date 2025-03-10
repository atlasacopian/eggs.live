import { prisma } from "@/lib/db";
import { getAllScrapers } from "./scrapers/index";

// Store configuration with selectors for egg prices
const stores = [
  // Regular eggs
  {
    id: "walmart",
    name: "Walmart",
    website: "https://www.walmart.com/ip/Great-Value-Large-White-Eggs-12-Count/145051970",
    priceSelector: ".f6-bu.f6-bv.f6-bw",
    eggType: "regular",
  },
  {
    id: "kroger",
    name: "Kroger",
    website: "https://www.kroger.com/p/kroger-grade-a-large-eggs/0001111060933",
    priceSelector: ".kds-Price-promotional, .kds-Price-regular",
    eggType: "regular",
  },
  {
    id: "target",
    name: "Target",
    website: "https://www.target.com/p/grade-a-large-eggs-12ct-good-38-gather-8482/-/A-14713534",
    priceSelector: '[data-test="product-price"]',
    eggType: "regular",
  },
  {
    id: "wholeFoods",
    name: "Whole Foods",
    website: "https://www.amazon.com/365-Everyday-Value-Large-Brown/dp/B07QK1VDPT/",
    priceSelector: ".a-price .a-offscreen",
    eggType: "regular",
  },
  {
    id: "costco",
    name: "Costco",
    website:
      "https://www.costco.com/kirkland-signature-cage-free-usda-aa-large-eggs%2c-24-count.product.100406922.html",
    priceSelector: ".price",
    eggType: "regular",
  },
  {
    id: "traderJoes",
    name: "Trader Joe's",
    website: "https://www.traderjoes.com/home/products/pdp/cage-free-large-eggs-057333",
    priceSelector: ".ProductPrice_productPrice__price__3-50O",
    eggType: "regular",
  },
  {
    id: "vons",
    name: "Vons",
    website: "https://www.vons.com/shop/product-details.970041.html",
    priceSelector: ".product-price",
    eggType: "regular",
  },
  {
    id: "ralphs",
    name: "Ralphs",
    website: "https://www.ralphs.com/p/large-eggs/0001111060933",
    priceSelector: ".kds-Price-promotional, .kds-Price-regular",
    eggType: "regular",
  },
  {
    id: "wegmans",
    name: "Wegmans",
    website: "https://shop.wegmans.com/product/46709/wegmans-grade-a-large-eggs",
    priceSelector: '[data-testid="product-price"]',
    eggType: "regular",
  },
  {
    id: "shopRite",
    name: "ShopRite",
    website: "https://www.shoprite.com/sm/pickup/rsid/3000/product/grade-a-large-eggs-00041190455616",
    priceSelector: ".ProductPrice",
    eggType: "regular",
  },
  {
    id: "publix",
    name: "Publix",
    website: "https://www.publix.com/pd/publix-eggs-large/RIO-PCI-114195",
    priceSelector: ".reg-price, .sale-price",
    eggType: "regular",
  },
  {
    id: "albertsons",
    name: "Albertsons",
    website: "https://www.albertsons.com/shop/product-details.970041.html",
    priceSelector: ".product-price",
    eggType: "regular",
  },
  {
    id: "safeway",
    name: "Safeway",
    website: "https://www.safeway.com/shop/product-details.970041.html",
    priceSelector: ".product-price",
    eggType: "regular",
  },
  {
    id: "aldi",
    name: "Aldi",
    website: "https://www.aldi.us/en/products/dairy-eggs/eggs/",
    priceSelector: ".price-wrapper .price",
    eggType: "regular",
  },
  {
    id: "heb",
    name: "H-E-B",
    website: "https://www.heb.com/product-detail/h-e-b-grade-a-large-eggs/1064033",
    priceSelector: ".prod-price",
    eggType: "regular",
  },
  {
    id: "meijer",
    name: "Meijer",
    website: "https://www.meijer.com/shopping/product/meijer-large-white-eggs-12-ct/70882510182.html",
    priceSelector: ".price-container .price",
    eggType: "regular",
  },
  {
    id: "foodLion",
    name: "Food Lion",
    website: "https://shop.foodlion.com/product/large-white-eggs/00041130007015",
    priceSelector: ".product-price",
    eggType: "regular",
  },
  {
    id: "giantEagle",
    name: "Giant Eagle",
    website: "https://shop.gianteagle.com/waterworks/product/00041130007015",
    priceSelector: ".product__price",
    eggType: "regular",
  },
  {
    id: "stopAndShop",
    name: "Stop & Shop",
    website: "https://stopandshop.com/product-search/large%20eggs",
    priceSelector: ".current-price",
    eggType: "regular",
  },
  {
    id: "winnDixie",
    name: "Winn-Dixie",
    website: "https://www.winndixie.com/shop/product-details/winn-dixie-grade-a-large-eggs-12-ct-00021140980018",
    priceSelector: ".price",
    eggType: "regular",
  },
  {
    id: "sprouts",
    name: "Sprouts",
    website: "https://shop.sprouts.com/product/33795/cage-free-large-grade-a-brown-eggs",
    priceSelector: ".product-price",
    eggType: "regular",
  },
  {
    id: "erewhon",
    name: "Erewhon",
    website: "https://www.erewhonmarket.com/products/vital-farms-pasture-raised-large-eggs",
    priceSelector: ".product-price .price",
    eggType: "regular",
  },
  {
    id: "food4less",
    name: "Food 4 Less",
    website: "https://www.food4less.com/p/kroger-grade-a-large-eggs/0001111060933",
    priceSelector: ".kds-Price-promotional, .kds-Price-regular",
    eggType: "regular",
  },

  // Organic eggs
  {
    id: "walmart-organic",
    name: "Walmart",
    website: "https://www.walmart.com/ip/Great-Value-Organic-Cage-Free-Large-Brown-Eggs-12-Count/51259469",
    priceSelector: ".f6-bu.f6-bv.f6-bw",
    eggType: "organic",
  },
  {
    id: "kroger-organic",
    name: "Kroger",
    website: "https://www.kroger.com/p/simple-truth-organic-cage-free-large-brown-eggs/0001111087374",
    priceSelector: ".kds-Price-promotional, .kds-Price-regular",
    eggType: "organic",
  },
  {
    id: "target-organic",
    name: "Target",
    website: "https://www.target.com/p/organic-cage-free-large-grade-a-eggs-12ct-good-38-gather-8482/-/A-14713537",
    priceSelector: '[data-test="product-price"]',
    eggType: "organic",
  },
  {
    id: "wholeFoods-organic",
    name: "Whole Foods",
    website: "https://www.amazon.com/365-Everyday-Value-Organic-Large/dp/B07QK1VDPT/",
    priceSelector: ".a-price .a-offscreen",
    eggType: "organic",
  },
  {
    id: "costco-organic",
    name: "Costco",
    website: "https://www.costco.com/kirkland-signature-usda-organic-large-eggs%2C-24-count.product.100406922.html",
    priceSelector: ".price",
    eggType: "organic",
  },
  {
    id: "traderJoes-organic",
    name: "Trader Joe's",
    website: "https://www.traderjoes.com/home/products/pdp/organic-eggs-057334",
    priceSelector: ".ProductPrice_productPrice__price__3-50O",
    eggType: "organic",
  },
  {
    id: "sprouts-organic",
    name: "Sprouts",
    website: "https://shop.sprouts.com/product/33796/sprouts-organic-cage-free-large-grade-a-brown-eggs",
    priceSelector: ".product-price",
    eggType: "organic",
  },
  {
    id: "food4less-organic",
    name: "Food 4 Less",
    website: "https://www.food4less.com/p/simple-truth-organic-cage-free-large-brown-eggs/0001111087374",
    priceSelector: ".kds-Price-promotional, .kds-Price-regular",
    eggType: "organic",
  },
]

// Function to extract price from text
function extractPrice(text: string): number {
  // Remove all non-numeric characters except decimal point
  const priceMatch = text.replace(/[^0-9.]/g, "")
  return Number.parseFloat(priceMatch) || 0
}

// Placeholder for the real scraper function
export async function scrapeEggPrices() {
  console.log("This is a placeholder for the real scraper function")
  
  // Use the scrapers to get placeholder data
  const scrapers = getAllScrapers();
  const regularPrices = [];
  const organicPrices = [];
  let successCount = 0;
  
  for (const scraper of scrapers) {
    try {
      const result = await scraper.scrape();
      
      if (result.regular !== null) {
        regularPrices.push({
          store: scraper.name,
          price: result.regular
        });
        successCount++;
      }
      
      if (result.organic !== null) {
        organicPrices.push({
          store: scraper.name,
          price: result.organic
        });
        successCount++;
      }
    } catch (error) {
      console.error(`Error scraping ${scraper.name}:`, error);
    }
  }

  // Return a placeholder result
  return {
    regular: regularPrices,
    organic: organicPrices,
    successCount,
    totalStores: stores.length,
  }
}

// Function to seed historical data (can be used for initial setup)
export async function seedHistoricalData() {
  console.log("Seeding historical egg price data...")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  try {
    // Create some stores if they don't exist
    const storeData = [
      { id: "walmart", name: "Walmart", website: "https://www.walmart.com" },
      { id: "kroger", name: "Kroger", website: "https://www.kroger.com" },
      { id: "target", name: "Target", website: "https://www.target.com" },
      { id: "wholeFoods", name: "Whole Foods", website: "https://www.amazon.com" },
      { id: "costco", name: "Costco", website: "https://www.costco.com" },
      { id: "traderJoes", name: "Trader Joe's", website: "https://www.traderjoes.com" },
      { id: "vons", name: "Vons", website: "https://www.vons.com" },
      { id: "ralphs", name: "Ralphs", website: "https://www.ralphs.com" },
      { id: "wegmans", name: "Wegmans", website: "https://shop.wegmans.com" },
      { id: "shopRite", name: "ShopRite", website: "https://www.shoprite.com" },
      { id: "publix", name: "Publix", website: "https://www.publix.com" },
      { id: "albertsons", name: "Albertsons", website: "https://www.albertsons.com" },
      { id: "safeway", name: "Safeway", website: "https://www.safeway.com" },
      { id: "aldi", name: "Aldi", website: "https://www.aldi.us" },
      { id: "heb", name: "H-E-B", website: "https://www.heb.com" },
      { id: "meijer", name: "Meijer", website: "https://www.meijer.com" },
      { id: "foodLion", name: "Food Lion", website: "https://shop.foodlion.com" },
      { id: "giantEagle", name: "Giant Eagle", website: "https://shop.gianteagle.com" },
      { id: "stopAndShop", name: "Stop & Shop", website: "https://stopandshop.com" },
      { id: "winnDixie", name: "Winn-Dixie", website: "https://www.winndixie.com" },
      { id: "sprouts", name: "Sprouts", website: "https://shop.sprouts.com" },
      { id: "erewhon", name: "Erewhon", website: "https://www.erewhonmarket.com" },
      { id: "food4less", name: "Food 4 Less", website: "https://www.food4less.com" },
    ]

    // Generate historical data for the past 90 days
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // For each store, generate historical prices
      for (const store of storeData) {
        // Generate regular egg prices
        const regularBasePrice = 3.5
        const regularVariation = Math.sin(i / 10) * 0.5 + (Math.random() - 0.5) * 0.2
        const regularPrice = Number.parseFloat((regularBasePrice + regularVariation).toFixed(2))

        await prisma.eggPrice.create({
          data: {
            storeId: store.id,
            price: regularPrice,
            eggType: "regular",
            date,
          },
        })

        // Generate organic egg prices
        const organicBasePrice = 5.99
        const organicVariation = Math.sin(i / 10) * 0.7 + (Math.random() - 0.5) * 0.3
        const organicPrice = Number.parseFloat((organicBasePrice + organicVariation).toFixed(2))

        await prisma.eggPrice.create({
          data: {
            storeId: store.id,
            price: organicPrice,
            eggType: "organic",
            date,
          },
        })
      }

      // Calculate and save average prices for each day
      for (const eggType of ["regular", "organic"]) {
        const prices = await prisma.eggPrice.findMany({
          where: {
            date,
            eggType,
          },
        })

        if (prices.length > 0) {
          const totalPrice = prices.reduce((sum, price) => sum + price.price, 0)
          const averagePrice = totalPrice / prices.length

          await prisma.averagePrice.upsert({
            where: {
              date_eggType: {
                date,
                eggType,
              },
            },
            update: {
              price: averagePrice,
              storeCount: prices.length,
            },
            create: {
              date,
              eggType,
              price: averagePrice,
              storeCount: prices.length,
            },
          })
        }
      }

      console.log(`Seeded data for ${date.toISOString().split("T")[0]}`)
    }

    console.log("Historical data seeding completed")
  } catch (error) {
    console.error("Error seeding historical data:", error)
    throw error
  }
}
