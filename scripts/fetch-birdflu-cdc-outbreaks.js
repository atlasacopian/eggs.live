// scripts/fetch-birdflu-cdc-outbreaks.js
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import fetch from 'node-fetch';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// CDC CSV containing all commercial & backyard outbreak confirmations
const CSV_URL = 'https://www.cdc.gov/bird-flu/modules/situation-summary/commercial-backyard-flocks.csv';

(async () => {
  try {
    // Grab the most recent report_date we already have so we only ingest new rows
    const { data: latest, error: latestErr } = await sb
      .from('bird_flu_outbreaks')
      .select('report_date')
      .order('report_date', { ascending: false })
      .limit(1);
    if (latestErr) throw latestErr;

    let lastDate = null;
    if (latest && latest.length > 0) {
      lastDate = String(latest[0].report_date).slice(0, 10); // YYYY-MM-DD
      console.log(`🐦 CDC ingest: will only store rows with Outbreak Date > ${lastDate}`);
    }

    // Download CSV
    let res;
    try {
      res = await fetch(CSV_URL);
    } catch (e) {
      console.warn(`CDC bird flu ingest skipped: network error fetching ${CSV_URL}: ${e.message}`);
      process.exit(0);
    }
    if (!res.ok) {
      console.warn(`CDC bird flu ingest skipped: HTTP ${res.status} for ${CSV_URL}`);
      process.exit(0);
    }
    const csvText = await res.text();
    const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    // Map rows
    const rows = data
      .filter(r => r['Outbreak Date'])
      .filter(r => {
        if (!lastDate) return true;
        const d = r['Outbreak Date'];
        // CSV date format is MM-DD-YYYY or similar; ensure ISO
        const [mm, dd, yyyy] = d.split('-');
        const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        return iso > lastDate;
      })
      .map(r => {
        const d = r['Outbreak Date'];
        const [mm, dd, yyyy] = d.split('-');
        const isoDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        const birds = Number((r['Flock Size'] || '0').replace(/,/g, '')) || null;
        return {
          report_date: isoDate,
          state: r['State']?.trim(),
          county: r['County']?.trim(),
          flock_type: r['Flock Type']?.trim(),
          birds_affected: birds,
          depop_status: null // CDC file doesn\'t include this
        };
      });

    if (rows.length === 0) {
      console.log('✅ No new CDC outbreak rows to upsert.');
      process.exit(0);
    }

    // Dedup primary key fields
    const uniq = new Map();
    for (const r of rows) {
      const key = [r.report_date, r.state.toUpperCase(), r.county.toUpperCase(), (r.flock_type || '').toUpperCase()].join('|');
      if (!uniq.has(key)) uniq.set(key, r);
    }
    const dedupedRows = Array.from(uniq.values());

    const { error: upsertErr } = await sb
      .from('bird_flu_outbreaks')
      .upsert(dedupedRows, { onConflict: 'report_date,state,county,flock_type' });

    if (upsertErr) {
      console.error('CDC bird flu upsert error', upsertErr);
      process.exit(1);
    }

    console.log(`✅ Upserted or verified ${dedupedRows.length} CDC bird flu outbreak rows`);
  } catch (e) {
    console.error('CDC bird flu ingest error', e);
    process.exit(1);
  }
})(); 