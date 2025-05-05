import { config } from 'dotenv';
config({ path: '.env.local' });
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

// ---- env vars ----
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TARGET_BASE_URL = 'https://www.target.com';
const EGG_SEARCH_PATH = '/s?searchTerm=egg';

// --- Constants ---
const KNOWN_EGG_TCINS = [
  '83719457', // Good & Gather 18ct Large White (from previous inspection)
  // Add more TCINs for relevant egg products here (e.g., dozen, organic)
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getStoreIdsFromDb() {
  console.log('📚 Fetching store IDs from Supabase...');
  const { data, error } = await sb
    .from('target_stores')
    .select('store_id, name, city, state') // Select necessary fields
    .order('state') // Process stores somewhat geographically if desired
    // .limit(10) // Optional: Limit for testing
    ;

  if (error) {
    console.error('❌ Error fetching store IDs:', error);
    return [];
  }
  console.log(`  -> Found ${data.length} stores.`);
  return data;
}

async function scrapePricesForStore(browser, store) {
  console.log(`🥚 Scraping egg prices for store: ${store.store_id} (${store.name}, ${store.city})`);
  const collectedPrices = [];
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36');

  try {
    // --- Set Store Context by Navigating to Store Page ---
    const storeUrl = `${TARGET_BASE_URL}/sl/${store.store_id}`;
    console.log(`   -> Navigating to store page to set context: ${storeUrl}`);
    await page.goto(storeUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    console.log(`   -> Store page loaded.`);
    await sleep(2000);
    // -----------------------------------------------------

    // --- Navigate to Egg Search Results (store context preserved via cookie) ---
    const searchUrl = `${TARGET_BASE_URL}${EGG_SEARCH_PATH}`;
    console.log(`   -> Navigating to egg search: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    console.log(`   -> Egg search page loaded.`);

    // --- Wait specifically for a known TCIN container to appear ---
    const targetTcinSelector = `[childorstandalonetcin="${KNOWN_EGG_TCINS[0]}"]`; // Wait for the first known TCIN
    console.log(`   -> Waiting for selector: ${targetTcinSelector}`);
    try {
      await page.waitForSelector(targetTcinSelector, { timeout: 15000 }); // Increased timeout slightly
      console.log(`   -> Target TCIN container found on page.`);
    } catch (waitError) {
      console.error(`   -> ❌ Timed out waiting for TCIN container: ${targetTcinSelector}`);
      // Optionally dump page HTML here for debugging if selector fails
      // const html = await page.content();
      // console.log("Page HTML on selector timeout:", html.substring(0, 1000));
      throw waitError; // Re-throw the error to skip price evaluation
    }
    // -----------------------------------------------------------

    await sleep(1000); // Small sleep after element found

    // --- Scrape Prices for Known TCINs with Debugging ---
    console.log(`   -> Scraping prices for TCINs: ${KNOWN_EGG_TCINS.join(', ')}`);

    const priceResults = await page.evaluate((knownTcins) => {
      const results = [];
      knownTcins.forEach(tcin => {
        console.log(`[Browser] Searching for TCIN: ${tcin}`);
        const productContainer = document.querySelector(`[childorstandalonetcin="${tcin}"]`);

        if (productContainer) {
          console.log(`[Browser] Found container for TCIN ${tcin}.`);
          const nameElement = productContainer.querySelector('a[data-test="product-title"]');
          const priceElement = productContainer.querySelector('span[data-test="@web/Price/PriceStandard"] span');

          const productName = nameElement ? nameElement.textContent.trim() : '[Name Not Found]';
          const currentPrice = priceElement ? priceElement.textContent.trim() : '[Price Not Found]';
          console.log(`[Browser]   - Name Element Found: ${!!nameElement}, Text: ${productName}`);
          console.log(`[Browser]   - Price Element Found: ${!!priceElement}, Text: ${currentPrice}`);

          // Basic type detection
          const productType = productName?.toLowerCase().includes('organic') ? 'organic' : 'regular';
          const priceType = 'regular';

          // Only add if price text was found (even if name wasn't perfect)
          if (priceElement) { // Check if price element was found
            results.push({
              tcin: tcin,
              product_name: productName,
              price: currentPrice, // Keep raw text for debugging
              price_type: priceType,
              product_type: productType
            });
          } else {
            console.log(`[Browser] Price element missing for TCIN ${tcin}, skipping result.`);
          }
        } else {
           console.log(`[Browser] Container for TCIN ${tcin} not found.`);
        }
      });
      return results;
    }, KNOWN_EGG_TCINS);

    collectedPrices.push(...priceResults.map(result => ({ ...result, store_id: store.store_id })));
    // ------------------------------------------

  } catch (error) {
    console.error(`❌ Error scraping prices for store ${store.store_id}:`, error.message);
  } finally {
    // Safely close the page to avoid 'session closed' errors
    try {
      if (page && !page.isClosed()) {
        await page.close();
      }
    } catch (closeErr) {
      console.warn(`⚠️ Failed to close page for store ${store.store_id}:`, closeErr.message);
    }
  }

  console.log(`   -> Collected ${collectedPrices.length} prices for store ${store.store_id}.`);
  return collectedPrices;
}

async function savePricesToDb(priceData) {
  if (!priceData || priceData.length === 0) return;

  const now = new Date();
  const capturedDate = now.toISOString().split('T')[0];

  const rowsToUpsert = priceData.map(data => ({
    store_id: data.store_id,
    tcin: data.tcin,
    captured_at: now.toISOString(),
    captured_date: capturedDate,
    product_name: data.product_name, // Make sure this is extracted
    price: data.price ? parseFloat(data.price.replace(/[^\d.]/g, '')) : null, // Clean and parse price
    price_type: data.price_type, // Extract this
    product_type: data.product_type, // Extract this
    raw_json: data, // Store raw scraped details
  }));

  console.log(`💾 Upserting ${rowsToUpsert.length} prices to Supabase table 'target_egg_prices'...`);
  const { error } = await sb
    .from('target_egg_prices')
    .upsert(rowsToUpsert, {
      onConflict: 'store_id, tcin, captured_date', // Match unique constraint
    });

  if (error) {
    console.error('❌ Supabase price upsert failed:', error);
  } else {
    console.log(`✅ Successfully upserted ${rowsToUpsert.length} prices.`);
  }
}

async function main() {
  console.time('target-price-scrape');
  console.log('🚀 Starting Target egg price scraping...');

  const stores = await getStoreIdsFromDb();
  if (stores.length === 0) {
    console.log('No stores found in DB. Exiting.');
    process.exit(0);
  }

  // Launch headless browser, disabling sandbox for CI environments
  const browser = await puppeteer.launch({
    headless: "new", // Use new headless mode
    args: [
      '--no-sandbox', // Required for GitHub Actions/Docker
      '--disable-setuid-sandbox' // Often needed with --no-sandbox
    ]
  });

  const allPriceData = [];

  const storesToProcess = stores.slice(0, 5);
  console.log(`🚨 DEBUG: Processing only first ${storesToProcess.length} stores.`);

  for (const store of storesToProcess) {
    const prices = await scrapePricesForStore(browser, store);
    allPriceData.push(...prices);
    await sleep(2000);
  }

  await browser.close();
  console.log(`🏁 Finished scraping. Found ${allPriceData.length} prices in total.`);

  await savePricesToDb(allPriceData);

  console.timeEnd('target-price-scrape');
  process.exit(0);
}

main().catch((err) => {
  console.error('Unhandled error in main:', err);
  process.exit(1);
}); 