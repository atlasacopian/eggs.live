import { chromium } from "playwright"
import { prisma } from "@/lib/db"

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
  // Add organic eggs for Walmart
  {
    id: "walmart-organic",
    name: "Walmart",
    website: "https://www.walmart.com/ip/Great-Value-Organic-Cage-Free-Large-Brown-Eggs-12-Count/51259469",
    priceSelector: ".f6-bu.f6-bv.f6-bw",
    eggType: "organic",
  },
  // Add organic eggs for Kroger
  {
    id: "kroger-organic",
    name: "Kroger",
    website: "https://www.kroger.com/p/simple-truth-organic-cage-free-large-brown-eggs/0001111087374",
    priceSelector: ".kds-Price-promotional, .kds-Price-regular",
    eggType: "organic",
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

  // Previously added stores
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

  // Newly added store
  {
    id: "erewhon",
    name: "Erewhon",
    website: "https://www.erewhonmarket.com/products/vital-farms-pasture-raised-large-eggs",
    priceSelector: ".product-price .price",
    eggType: "regular",
  },
]

// Function to extract price from text
function extractPrice(text: string): number {
  // Remove all non-numeric characters except decimal point
  const priceMatch = text.replace(/[^0-9.]/g, "")
  return Number.parseFloat(priceMatch) || 0
}

// Main scraper function
export async function scrapeEggPrices() {
  console.log("Starting egg price scraping...")

  const browser = await chromium.launch({
    headless: true,
  })

  const results = {
    regular: [],
    organic: [],
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Set to beginning of day

  try {
    // Ensure all stores exist in the database
    for (const store of stores) {
      const storeId = store.id.replace("-organic", "") // Remove -organic suffix for store ID
      await prisma.store.upsert({
        where: { id: storeId },
        update: { name: store.name, website: store.website },
        create: { id: storeId, name: store.name, website: store.website },
      })
    }

    // Scrape each store
    for (const store of stores) {
      try {
        console.log(`Scraping ${store.name} (${store.eggType})...`)

        const context = await browser.newContext({
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        })

        const page = await context.newPage()
        await page.goto(store.website, { waitUntil: "domcontentloaded", timeout: 60000 })

        // Wait for price element to be visible
        await page.waitForSelector(store.priceSelector, { timeout: 30000 })

        // Extract price text
        const priceText = await page.$eval(store.priceSelector, (el) => el.textContent || "")
        const price = extractPrice(priceText)

        if (price > 0) {
          console.log(`${store.name} ${store.eggType} price: $${price}`)

          // Save to database - use the base store ID without the -organic suffix
          const storeId = store.id.replace("-organic", "")
          await prisma.eggPrice.create({
            data: {
              storeId: storeId,
              price,
              eggType: store.eggType,
              date: today,
            },
          })

          results[store.eggType].push({
            store: store.name,
            price,
          })
        } else {
          console.log(`Failed to extract valid price for ${store.name} (${store.eggType})`)
        }

        await context.close()
      } catch (error) {
        console.error(`Error scraping ${store.name} (${store.eggType}):`, error)
      }
    }

    // Calculate and save average prices for each egg type
    for (const eggType of ["regular", "organic"]) {
      if (results[eggType].length > 0) {
        const totalPrice = results[eggType].reduce((sum, result) => sum + result.price, 0)
        const averagePrice = totalPrice / results[eggType].length

        console.log(`Average ${eggType} price: $${averagePrice.toFixed(2)} from ${results[eggType].length} stores`)

        // Save average price
        await prisma.averagePrice.upsert({
          where: {
            date_eggType: {
              date: today,
              eggType: eggType,
            },
          },
          update: {
            price: averagePrice,
            storeCount: results[eggType].length,
          },
          create: {
            date: today,
            eggType: eggType,
            price: averagePrice,
            storeCount: results[eggType].length,
          },
        })
      }
    }

    return results
  } catch (error) {
    console.error("Scraping error:", error)
    throw error
  } finally {
    await browser.close()
    console.log("Scraping completed")
  }
}

