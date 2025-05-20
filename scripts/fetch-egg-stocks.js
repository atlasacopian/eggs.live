// fetch-egg-stocks.js
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  POLYGON_API_KEY
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !POLYGON_API_KEY) {
  console.error('❌ Missing env vars. Need SUPABASE_URL, SUPABASE_SERVICE_KEY, POLYGON_API_KEY');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper: determine if NYSE market is open now (approx 9:30-16:00 ET)
function marketIsOpen() {
  const nyNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = nyNow.getDay(); // 0 Sun ... 6 Sat
  if (day === 0 || day === 6) return false; // weekend
  const minutes = nyNow.getHours() * 60 + nyNow.getMinutes();
  const open = 9 * 60 + 30; // 09:30
  const close = 16 * 60 + 10; // small buffer past 16:00
  return minutes >= open && minutes <= close;
}

if (!marketIsOpen()) {
  console.log('Market closed – skipping Polygon fetch.');
  process.exit(0);
}

// Tickers we care about (major companies that sell eggs)
const TICKERS = ['CALM', 'POST', 'HRL'];

async function fetchSnapshot () {
  const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=${TICKERS.join(',')}&apiKey=${POLYGON_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Polygon ${res.status} – ${await res.text().catch(()=>'<err body>')}`);
  }
  const json = await res.json();
  if (json.status !== 'OK') {
    throw new Error(`Unexpected Polygon status ${json.status}`);
  }
  return json.tickers ?? [];
}

(async () => {
  try {
    const tickers = await fetchSnapshot();
    const now = new Date().toISOString();

    // Map to rows; if list empty just exit (market closed)
    const rows = tickers.map((t) => {
      const price = t.lastTrade?.p ?? t.day?.c ?? null;
      const open  = t.day?.o ?? price;
      const change_pct = price && open ? ((price - open) / open) * 100 : null;
      return {
        symbol: t.ticker,
        price,
        change_pct,
        updated_at: now
      };
    });

    if (rows.length === 0) {
      console.log('Polygon returned 0 tickers – market likely closed. Exiting.');
      process.exit(0);
    }

    // Upsert into Supabase table (no historical rows kept)
    const { error } = await sb
      .from('egg_stock_quotes')
      .upsert(rows, { onConflict: 'symbol' });

    if (error) {
      console.error('Supabase upsert error', error);
      process.exit(1);
    }

    console.log(`✅ Upserted ${rows.length} stock quotes at ${now}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error', err);
    process.exit(1);
  }
})(); 