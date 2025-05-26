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

const CSV_URL = 'https://publicdashboards.dl.usda.gov/t/MRP_PUB/views/VS_Avian_HPAIConfirmedDetections2022/HPAI2022ConfirmedDetections?%3Aformat=csv';

(async () => {
  try {
    const res = await fetch(CSV_URL);
    if (res.status === 404) {
      console.warn(`Bird flu ingestion skipped: CSV not found (404): ${CSV_URL}`);
      process.exit(0);
    }
    if (!res.ok) throw new Error(`CSV download ${res.status}`);
    const csvText = await res.text();
    const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

    const rows = data
      .filter(row => row['Confirmed']) // ensure the Confirmed date exists
      .map(row => ({
        report_date: row['Confirmed'],
        state: row['State'],
        county: row['County Name'],
        flock_type: row['Production'],
        birds_affected: Number((row['Birds Affected'] || '0').replace(/,/g, '')),
        depop_status: row['Control Area Released']
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

    const pLimit = (n)=>{
      const q=[];let a=0;
      const run=()=>{
        if(!q.length||a>=n) return;
        const {fn,res}=q.shift();a++;fn().then(res).finally(()=>{a--;run()});run()}
      ;return (fn)=>new Promise(r=>{q.push({fn,res:r});run()})};

    const limit = pLimit(10);
    let success = 0;
    for (const row of dedupedRows) {
      await limit(async () => {
        // insert with DO NOTHING on conflicts
        const { error } = await sb
          .from('bird_flu_outbreaks')
          .insert([row], { ignoreDuplicates: true });
        if (!error) success++; else console.warn('row err', error.message);
      });
    }

    console.log(`✅ Upserted ${success}/${dedupedRows.length} bird flu rows (deduped from ${rows.length})`);
  } catch (e) {
    console.error('Bird flu ingest error', e);
    process.exit(1);
  }
})(); 