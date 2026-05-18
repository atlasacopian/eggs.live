import { config } from 'dotenv'
config({ path: '.env.local' })
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import { runIfMain } from './lib/run-if-main.js'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  USDA_API_KEY,
} = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase env vars missing')
  process.exit(1)
}

if (!USDA_API_KEY) {
  console.error('❌ USDA_API_KEY env var missing – please set it in your shell, .env.local, or GitHub Action secrets')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function isDozen(pkg) {
  // Early USDA rows often have blank/null package_size; accept them.
  if (!pkg) return true
  const p = pkg.toString().toLowerCase()
  return p.includes('12') || p.includes('dozen')
}

// Exclude rows we don't want (liquid eggs, 18-count)
function shouldSkip(row) {
  const pkg = (row.package_size || '').toLowerCase()
  const typ = (row.type || '').toLowerCase()

  // 1. Skip anything that references liquid eggs
  if (pkg.includes('liquid') || typ.includes('liquid')) return true

  // 2. Skip 18-count packages (e.g. "18 pack")
  if (pkg.match(/\b18\b/) || typ.match(/\b18\b/)) return true

  return false
}

// Add helper to fetch latest report_end_date from Supabase
async function getLatestStoredEndDate () {
  const { data, error } = await sb
    .from('usda_weekly_egg_prices')
    .select('report_end_date')
    .order('report_end_date', { ascending: false })
    .limit(1)
  if (error) {
    console.error('Failed to fetch latest report_end_date', error)
    return null
  }
  if (!data || !data.length || !data[0].report_end_date) return null
  return new Date(data[0].report_end_date)
}

// Helper to parse MM/DD/YYYY to YYYY-MM-DD
function formatToIsoDate(dateStr) {
  if (!dateStr) return null;
  const [m, d, y] = dateStr.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// ---------- core fetch + aggregate ----------
export async function run({ latestOnly = false } = {}) {
  const slugId = 'AMS_2757'
  const section = 'Report%20Details'
  const creds = Buffer.from(`${USDA_API_KEY.trim()}:`).toString('base64')

  // NOTE: the MARS API ignores page & pageSize for this endpoint and always
  //       returns the full dataset (~67k rows). We therefore fetch ONCE and
  //       drop the old pagination loop.
  const url = `https://marsapi.ams.usda.gov/services/v1.2/reports/${slugId}/${section}?page=1`
  console.log('📥 USDA fetch …')
    const res = await fetch(url, { headers: { Authorization: `Basic ${creds}` } })
    if (!res.ok) {
      console.error('USDA request failed', res.status)
    return
    }
    const json = await res.json()
    const rows = json.results || []
  console.log(`   ↳ received ${rows.length.toLocaleString()} rows`)

  if (!rows.length) {
    console.error('No rows received from API - abort');
    return;
  }

  // Helper to parse MM/DD/YYYY from API to a Date object for comparison
  function parseApiDate(apiDateStr) {
    if (!apiDateStr) return null;
    const parts = apiDateStr.split('/');
    if (parts.length !== 3) return null;
    const [m, d, y] = parts.map(Number);
    if (isNaN(m) || isNaN(d) || isNaN(y)) return null;
    return new Date(y, m - 1, d);
  }

  const outMap = new Map(); // Maps periodKey to { regular: [], organic: [], _allRegular: [], _allOrganic: [], report_start_date_iso: '', report_end_date_iso: '' }

  if (latestOnly) {
    console.log('⚙️ Running in "latestOnly" mode.');
    // 1️⃣ Find the single latest report period in this payload
    let latestPeriod = { begin: '', end: '', code: 0 }; // code is YYYYMMDD for end date
    for (const r of rows) {
      if (!r.report_begin_date || !r.report_end_date) continue;
      const [end_m, end_d, end_y] = r.report_end_date.split(' ')[0].split('/');
      const end_code = parseInt(`${end_y}${end_m.padStart(2,'0')}${end_d.padStart(2,'0')}`, 10);
      if (end_code > latestPeriod.code) {
        latestPeriod.code = end_code;
        latestPeriod.begin = r.report_begin_date.split(' ')[0];
        latestPeriod.end = r.report_end_date.split(' ')[0];
      }
    }

    if (!latestPeriod.begin || !latestPeriod.end) {
      console.error('No valid report period found in API data for latestOnly mode – abort');
      return;
    }
    console.log(`Latest report period from API: ${latestPeriod.begin} - ${latestPeriod.end}`);

    const lastStoredEndDate = await getLatestStoredEndDate();
    if (lastStoredEndDate) {
      const currentApiLatestEndDate = parseApiDate(latestPeriod.end);
      if (currentApiLatestEndDate) {
          currentApiLatestEndDate.setHours(0, 0, 0, 0);
          lastStoredEndDate.setHours(0, 0, 0, 0);
          if (currentApiLatestEndDate <= lastStoredEndDate) {
            console.log(`✅ USDA data already up to date. Supabase latest end_date: ${lastStoredEndDate.toISOString().split('T')[0]}, API payload latest end_date: ${currentApiLatestEndDate.toISOString().split('T')[0]}. No update needed.`);
            return;
          }
          console.log(`ℹ️ New USDA data found. Supabase latest end_date: ${lastStoredEndDate.toISOString().split('T')[0]}, API payload latest end_date: ${currentApiLatestEndDate.toISOString().split('T')[0]}. Proceeding with update for latest period.`);
      }
    }
    
    // Process only this single latest period
    const nat = { regular: [], organic: [] };
    const all = { regular: [], organic: [] };
    for (const r of rows) {
      if (r.report_begin_date === latestPeriod.begin && r.report_end_date === latestPeriod.end) {
        if (shouldSkip(r)) continue;
        if (!isDozen(r.package_size)) continue;
        const price = parseFloat(r.price_avg);
        if (!price || Number.isNaN(price)) continue;
        const kind = (r.environment || '').toLowerCase().includes('organic') ? 'organic' : 'regular';
        all[kind].push(price);
        if ((r.region || '').toLowerCase() === 'national') {
          nat[kind].push(price);
        }
      }
    }
    const mapKey = `${latestPeriod.begin}_${latestPeriod.end}`;
    outMap.set(mapKey, {
      regular: nat.regular.length ? nat.regular : [],
      organic: nat.organic.length ? nat.organic : [],
      _allRegular: all.regular,
      _allOrganic: all.organic,
      report_start_date_iso: formatToIsoDate(latestPeriod.begin),
      report_end_date_iso: formatToIsoDate(latestPeriod.end),
    });

  } else { // ----- This is the BACKFILL / LATEST_ONLY=FALSE path -----
    console.log('⚙️ Running in full backfill mode (latestOnly=false). Processing all unique report periods from API data.');
    const uniquePeriods = new Map(); // Key: "MM/DD/YYYY_MM/DD/YYYY", Value: {begin: "MM/DD/YYYY", end: "MM/DD/YYYY"}
    
    for (const r of rows) {
      if (r.report_begin_date && r.report_end_date) {
        const beginDate = r.report_begin_date.split(' ')[0];
        const endDate = r.report_end_date.split(' ')[0];
        const periodKey = `${beginDate}_${endDate}`;
        if (!uniquePeriods.has(periodKey)) {
          uniquePeriods.set(periodKey, { begin: beginDate, end: endDate });
        }
      }
    }
    console.log(`Found ${uniquePeriods.size} unique report periods in API data.`);

    let processedCount = 0;
    for (const [periodKey, period] of uniquePeriods) {
      processedCount++;
      if (processedCount % 100 === 0 || processedCount === uniquePeriods.size) {
         console.log(`Processing period ${processedCount}/${uniquePeriods.size}: ${period.begin} - ${period.end}`);
      }

      const nat = { regular: [], organic: [] };
      const all = { regular: [], organic: [] };

      for (const r of rows) {
        // Filter for rows matching the current unique period
        if (r.report_begin_date && r.report_end_date && 
            r.report_begin_date.split(' ')[0] === period.begin && 
            r.report_end_date.split(' ')[0] === period.end) {
          
          if (shouldSkip(r)) continue;
          if (!isDozen(r.package_size)) continue;
          const price = parseFloat(r.price_avg);
          if (!price || Number.isNaN(price)) continue;

          const kind = (r.environment || '').toLowerCase().includes('organic') ? 'organic' : 'regular';
          all[kind].push(price);
          if ((r.region || '').toLowerCase() === 'national') {
            nat[kind].push(price);
          }
        }
      }
      
      // Only add to outMap if there's data for this period to avoid empty entries
      if (nat.regular.length || nat.organic.length || all.regular.length || all.organic.length) {
        outMap.set(periodKey, {
          regular: nat.regular.length ? nat.regular : [],
          organic: nat.organic.length ? nat.organic : [],
          _allRegular: all.regular,
          _allOrganic: all.organic,
          report_start_date_iso: formatToIsoDate(period.begin),
          report_end_date_iso: formatToIsoDate(period.end),
        });
      }
    }
  } // End of if (latestOnly) / else (backfill) block

  console.log(`Aggregated map size before flush: ${outMap.size}`);
  if (outMap.size > 0) {
    await flush(outMap);
  } else {
    console.log('No data to flush.');
  }

  console.log(`🎉 USDA weekly sync ${latestOnly ? '(latest only mode)' : '(full backfill mode)'} complete`);
}

async function flush(map) {
  const now = new Date().toISOString()
  const upsertData = [] // Changed name to upsertData for clarity
  for (const [periodKey, entry] of map.entries()) {
    for (const kind of ['regular', 'organic']) {
      const arrNat = entry[kind]; // National prices for the current kind
      const arrAll = kind === 'regular' ? entry._allRegular : entry._allOrganic; // All regional prices for the current kind
      
      // arrNat is used for the main 'price' (national average)
      if (!arrNat || arrNat.length === 0) continue; // Skip if no national data for this kind

      const avgPrice = parseFloat((arrNat.reduce((s, p) => s + p, 0) / arrNat.length).toFixed(2));
      
      // arrAll is used for price_min and price_max across all regions
      // If arrAll is empty (e.g. organic only reported nationally), use avgPrice for min/max
      const minPrice = (arrAll && arrAll.length > 0) ? parseFloat(Math.min(...arrAll).toFixed(2)) : avgPrice;
      const maxPrice = (arrAll && arrAll.length > 0) ? parseFloat(Math.max(...arrAll).toFixed(2)) : avgPrice;

      let dbProductType;
      if (kind === 'regular') {
        dbProductType = 'grd a lrg';
      } else if (kind === 'organic') {
        dbProductType = 'organic';
      } else {
        continue; // Should not happen with the current loop
      }

      upsertData.push({
        report_start_date: entry.report_start_date_iso,
        report_end_date: entry.report_end_date_iso,
        product_type: dbProductType,
        price: avgPrice,
        price_min: minPrice,
        price_max: maxPrice,
      });
    }
  }

  if (upsertData.length > 0) {
    console.log(`   फ्लशिंग ${upsertData.length} записи в Supabase...`);
    const CHUNK_SIZE = 500; // Supabase recommends chunks of a few hundred for large upserts
    for (let i = 0; i < upsertData.length; i += CHUNK_SIZE) {
      const chunk = upsertData.slice(i, i + CHUNK_SIZE);
    const { error } = await sb.from('usda_weekly_egg_prices').upsert(chunk, {
        onConflict: 'report_start_date,report_end_date,product_type',
      });
    if (error) {
        console.error('Supabase upsert error:', error);
        // Decide if you want to stop or continue on error
      } else {
        console.log(`    ↳ chunk ${i / CHUNK_SIZE + 1} upserted successfully (${chunk.length} records).`);
      }
      if (upsertData.length > CHUNK_SIZE && i + CHUNK_SIZE < upsertData.length) {
        await sleep(500); // Brief pause between large chunks
      }
    }
  } else {
    console.log('No data to flush to Supabase.');
  }
}

runIfMain(() => run({ latestOnly: process.argv.includes('--latest') }), import.meta.url); 