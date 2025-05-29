// scripts/fetch-birdflu-us.js
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

// APHIS Socrata CSV endpoint for HPAI confirmed detections (includes up-to-date data)
const CSV_URL = 'https://data.aphis.usda.gov/resource/y7g5-8w6x.csv?$limit=50000';

(async () => {
  try {
    // Look up the latest report_date we have in Supabase
    const { data: latest, error: latestError } = await sb
      .from('bird_flu_outbreaks')
      .select('report_date')
      .order('report_date', { ascending: false })
      .limit(1);
    if (latestError) {
      console.error('Error fetching latest report_date:', latestError);
      process.exit(1);
    }
    // Build fetch URL: only grab records on or after the last stored date
    let fetchUrl = CSV_URL;
    if (latest && latest.length > 0) {
      const lastDate = String(latest[0].report_date).slice(0, 10); // YYYY-MM-DD
      console.log(`🐦 Fetching bird flu records on or after ${lastDate}`);
      fetchUrl = `${CSV_URL}&$where=confirmation_date>='${lastDate}'`;
    }
    const res = await fetch(fetchUrl);
    if (res.status === 404) {
      console.warn(`Bird flu ingestion skipped: CSV not found (404): ${CSV_URL}`);
      process.exit(0);
    }
    if (!res.ok) throw new Error(`CSV download ${res.status}`);
    const csvText = await res.text();
    const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    // Map APHIS Socrata CSV fields
    const rows = data
      .filter(row => row['confirmation_date']) // ensure there is a confirmation date
      .map(row => ({
        report_date: row['confirmation_date'],
        state: row['state'],
        county: row['county'],
        flock_type: row['production_type'],
        birds_affected: Number((row['birds_affected'] || '0').replace(/,/g, '')),
        depop_status: row['depopulation_status']
      }));

    // Deduplicate rows on primary-key fields to avoid ON CONFLICT errors
    const uniq = new Map();
    for (const r of rows) {
      const key = [
        String(r.report_date).slice(0, 10), // YYYY-MM-DD
        String(r.state).trim().toUpperCase(),
        String(r.county).trim().toUpperCase(),
        String(r.flock_type || '').trim().toUpperCase()
      ].join('|');
      if (!uniq.has(key)) uniq.set(key, r);
    }
    const dedupedRows = Array.from(uniq.values());

    // Upsert all deduped rows in one statement keyed on report_date, state, county, and flock_type
    const { error: upsertError } = await sb
      .from('bird_flu_outbreaks')
      .upsert(dedupedRows, {
        onConflict: 'report_date,state,county,flock_type'
      });

    if (upsertError) {
      // Ignore duplicate key violations (unique constraint errors)
      if (upsertError.code === '23505' || upsertError.message.includes('duplicate key value')) {
        console.warn('⚠️ Duplicate key violations in bird_flu_outbreaks; skipping duplicate records.');
      } else {
        throw upsertError;
      }
    }
    console.log(`✅ Upserted or verified ${dedupedRows.length} bird flu rows (deduped from ${rows.length})`);
  } catch (e) {
    console.error('Bird flu ingest error', e);
    process.exit(1);
  }
})(); 