import { config } from 'dotenv';
config({ path: '.env.local' });
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import pLimit from 'p-limit';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, BRIGHTDATA_BROWSER_AUTH } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set');
  process.exit(1);
}
if (!BRIGHTDATA_BROWSER_AUTH) {
  console.error('❌ BRIGHTDATA_BROWSER_AUTH must be set (Bright Data Scraping Browser zone credentials, user:pass)');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const wsEndpoint = `wss://${BRIGHTDATA_BROWSER_AUTH}@brd.superproxy.io:9222`;

// RedSky (Target's product-search API) is now behind PerimeterX and no
// longer reachable directly - see database/README or commit history for
// the investigation. This scrapes via a real browser session instead:
// set the store's zip through Target's actual location picker (the only
// way we found to get genuinely store-specific pickup pricing - the search
// results grid shows the same nationwide price regardless of location),
// then open each matched product's detail page for its real price.

// Kept in sync with the exclude list and organic check in
// fetch-kroger-egg-prices.js's classify logic - same product shape, same
// brand-agnostic 12-count-eggs definition across retailers.
const EXCLUDE_WORDS = ['eggo', 'frozen', 'pancake', 'waffle', 'muffin', 'protein', 'powder', 'hard-cooked', 'scramble', 'liquid', 'bites'];
function classifyEggProduct(title) {
  if (!title) return null;
  const txt = title.toLowerCase();
  if (EXCLUDE_WORDS.some((w) => txt.includes(w))) return null;
  if (!/\beggs?\b/.test(txt)) return null;
  if (!/(\b12(?:\s*ct|\s*pk)?\b|\bdozen\b|\bdoz\b|\b12\b)/i.test(txt)) return null;
  if (/organic/.test(txt) || /\borg\b/.test(txt)) return 'organic';
  return 'regular';
}

function shipToZip(text) {
  const m = text.match(/Ship to (\d{5})/);
  return m ? m[1] : null;
}

function normalizeForMatch(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// A distinctive fragment of the expected title (brand + first few words) -
// used to confirm the page actually finished navigating to THIS product
// before trusting its price. Target's site does client-side routing, and
// a "$ is present" check alone can pass on leftover content from the
// previous page (e.g. the search listing, which has its own $ prices for
// other pack sizes) before the new page has fully replaced it.
function titleFingerprint(title) {
  return normalizeForMatch(title).split(' ').slice(0, 4).join(' ');
}

async function setStoreZip(page, zip) {
  await page.goto('https://www.target.com/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.getByText(/Ship to \d{5}/i).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.getByText(/Ship to \d{5}/i).first().click();
  await page.waitForSelector('#zip-code', { timeout: 15000 });
  await page.waitForTimeout(800);
  const zipInput = page.locator('#zip-code');
  await zipInput.fill('');
  await zipInput.fill(zip);
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    document.querySelector('button[data-test="@web/LocationFlyout/UpdateLocationButton"]')?.click();
  });
  await page.waitForTimeout(4000);

  const text = await page.evaluate(() => document.body.innerText);
  return shipToZip(text) === zip;
}

async function fetchStoreEggs(location_id, zip, enableLog = false) {
  // Each store gets its own dedicated connection to the Scraping Browser,
  // not a shared browser with multiple contexts - concurrent contexts on
  // one connection were found to leak location state between stores
  // (verified via the shipToZip drift-check below producing cross-store
  // mismatches under concurrency), so isolation has to happen at the
  // connection level.
  const browser = await chromium.connectOverCDP(wsEndpoint);
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  const buckets = { regular: [], organic: [] };

  try {
    const zipConfirmed = await setStoreZip(page, zip);
    if (!zipConfirmed) {
      if (enableLog) console.warn(`⚠️ Could not confirm zip ${zip} for store ${location_id}; retrying once.`);
      const retryConfirmed = await setStoreZip(page, zip);
      if (!retryConfirmed) {
        throw new Error(`Zip ${zip} would not stick for store ${location_id}`);
      }
    }

    await page.goto('https://www.target.com/s?searchTerm=eggs', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => document.body.innerText.includes('$'), { timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const candidates = await page.$$eval('a[href*="/p/"]', (els) =>
      els.map((el) => ({ href: el.getAttribute('href'), title: el.textContent || '' }))
    );

    // De-dupe by href (a title/link can appear more than once in the grid -
    // sponsored slot plus organic listing, etc.) and classify each into
    // regular/organic 12-count eggs using the same rules every retailer uses.
    const seen = new Set();
    const matched = [];
    for (const c of candidates) {
      if (!c.href || seen.has(c.href)) continue;
      const type = classifyEggProduct(c.title);
      if (!type) continue;
      seen.add(c.href);
      matched.push({ ...c, type });
    }

    if (enableLog) {
      console.log(`→ Store ${location_id}: ${matched.length} matched egg products in listing:`);
      for (const m of matched) console.log(`   [${m.type}] "${m.title.trim().slice(0, 80)}" -> ${m.href}`);
    }

    // Eggs are sold at essentially every Target - zero matches almost
    // always means an incomplete/congested page load rather than a real
    // "this store has no eggs" result. Throw so the caller retries instead
    // of recording a false NO_DATA_FOUND.
    if (matched.length === 0) {
      throw new Error(`No egg products matched in listing for store ${location_id} - likely an incomplete page load`);
    }

    for (const { href, type, title } of matched) {
      const detailUrl = href.startsWith('http') ? href : `https://www.target.com${href}`;
      const expectedFingerprint = titleFingerprint(title);

      await page.goto(detailUrl, { waitUntil: 'domcontentloaded', timeout: 90000 });
      // A fixed sleep here was intermittently too short for the price to
      // finish rendering (location was already confirmed correct, but the
      // $ text just hadn't hydrated yet) - wait for actual price content
      // the same way the search listing page already does.
      await page.waitForFunction(() => /\$\d+\.\d{2}/.test(document.body.innerText), { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(500);
      let detailText = await page.evaluate(() => document.body.innerText);

      // Target's site does client-side routing - a "$" being present can
      // still be leftover content from the PREVIOUS page (the search
      // listing has its own $ prices for other pack sizes/products) before
      // the new page has fully replaced it. Confirm we're actually looking
      // at the product we navigated to before trusting anything on it.
      if (!normalizeForMatch(detailText).includes(expectedFingerprint)) {
        if (enableLog) console.warn(`  ⚠️ Page hadn't finished navigating to "${title.trim().slice(0, 50)}" yet; waiting and re-checking.`);
        await page.waitForTimeout(2500);
        detailText = await page.evaluate(() => document.body.innerText);
        if (!normalizeForMatch(detailText).includes(expectedFingerprint)) {
          if (enableLog) console.warn(`  ⚠️ Still on the wrong page for "${title.trim()}"; skipping this price.`);
          continue;
        }
      }

      const detailZip = shipToZip(detailText);
      if (enableLog) console.log(`  [detail] shipToZip=${detailZip} (expected ${zip}) for ${title.trim().slice(0, 60)}`);

      // Confirm the location held on the detail page too - we've seen it
      // silently revert to an IP-based default before, and a price read
      // under the wrong location is worse than no price at all.
      if (detailZip !== zip) {
        if (enableLog) console.warn(`  ⚠️ Location drifted on detail page for ${title.trim()}; skipping this price.`);
        continue;
      }

      const priceMatch = detailText.match(/\$(\d+\.\d{2})/);
      if (priceMatch) {
        const price = Number(priceMatch[1]);
        buckets[type].push(price);
        if (enableLog) console.log(`  ${type}: $${price} — ${title.trim()}`);
      } else if (enableLog) {
        console.warn(`  ⚠️ No price pattern found on detail page for ${title.trim()}`);
      }
    }
  } finally {
    await context.close();
    await browser.close();
  }

  return buckets;
}

(async () => {
  console.log('📦 Loading target_stores from Supabase...');
  async function getAllStores() {
    const all = [];
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await sb
        .from('target_stores')
        .select('location_id, zip')
        .range(from, from + pageSize - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < pageSize) break;
    }
    return all;
  }

  let stores;
  try {
    stores = await getAllStores();
  } catch (e) {
    console.error('❌ Failed to load stores:', e.message);
    process.exit(1);
  }
  console.log(`→ ${stores.length} stores fetched.`);

  const args = process.argv.slice(2);
  const debugIds = args.filter((a) => /^\d+$/.test(a)).map(Number);
  const enableLog = args.includes('--show');
  if (debugIds.length) {
    stores = stores.filter((s) => debugIds.includes(Number(s.location_id)));
    console.log(`→ Debug mode: processing only stores [${debugIds.join(', ')}]`);
  }

  const startAtEnv = Number(process.env.START_AT ?? '0');
  const maxStoresPerRun = Number(process.env.MAX_STORES_PER_RUN ?? '0');
  let storesToProcess = stores.slice(startAtEnv);
  if (maxStoresPerRun > 0) storesToProcess = storesToProcess.slice(0, maxStoresPerRun);

  console.log(`→ Processing ${storesToProcess.length} stores.`);

  // Multiple simultaneous Scraping Browser connections were unreliable
  // against this account (rate limits, timeouts, incomplete loads) -
  // default to fully sequential; raise via env once a higher concurrency
  // is confirmed stable.
  const concurrency = Number(process.env.CONCURRENCY ?? '1');
  const limit = pLimit(concurrency);

  const now = new Date();
  const captured_date = now.toISOString().split('T')[0];
  const captured_at = now.toISOString();

  await Promise.all(storesToProcess.map((s, idx) => limit(async () => {
    const { location_id, zip } = s;
    console.log(`\n===== Processing store ${location_id} (zip ${zip}) [${idx + 1}/${storesToProcess.length}] =====`);

    let buckets;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        buckets = await fetchStoreEggs(location_id, zip, enableLog);
        break;
      } catch (e) {
        // Failures here have turned out to be transient session/connection
        // congestion against the Scraping Browser (rate limits, timeouts,
        // or an incomplete page load surfaced as zero matched products) -
        // back off and retry rather than losing the store for the day.
        if (attempt < maxAttempts) {
          const waitMs = 10000 * attempt;
          console.warn(`⚠️ Store ${location_id}: ${e.message}. Retrying in ${waitMs / 1000}s (attempt ${attempt}/${maxAttempts})`);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        console.error(`❌ Failed to scrape store ${location_id}:`, e.message);
        return;
      }
    }
    if (!buckets) return;

    const stats = {};
    for (const type of ['regular', 'organic']) {
      const arr = buckets[type];
      if (!arr.length) {
        stats[`${type}_min`] = null;
        stats[`${type}_avg`] = null;
        stats[`${type}_max`] = null;
      } else {
        const sum = arr.reduce((a, b) => a + b, 0);
        stats[`${type}_min`] = Math.min(...arr);
        stats[`${type}_avg`] = Number((sum / arr.length).toFixed(2));
        stats[`${type}_max`] = Math.max(...arr);
      }
    }
    const status = (stats.regular_min != null || stats.organic_min != null) ? 'OK' : 'NO_DATA_FOUND';
    const row = { location_id, captured_date, captured_at, status, ...stats };
    console.table([row]);

    const { error: upErr } = await sb
      .from('target_egg_prices')
      .upsert([row], { onConflict: 'location_id,captured_date' });
    if (upErr) console.error(`❌ Upsert failed for store ${location_id}:`, upErr.message);
    else console.log('✅ Upsert successful');
  })));

  console.log('\n🏁 All stores processed.');
  process.exit(0);
})();
