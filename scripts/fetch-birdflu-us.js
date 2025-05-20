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

    const rows = data.map(row => ({
      report_date: row['report_date'],
      state: row['state'],
      county: row['county'],
      flock_type: row['flock_type'],
      birds_affected: Number(row['birds_affected'] || 0),
      depop_status: row['depopulation_status']
    }));

    const { error } = await sb.from('bird_flu_outbreaks').upsert(rows, { onConflict: 'report_date,state,county,flock_type' });
    if (error) throw error;
    console.log(`✅ Upserted ${rows.length} bird flu rows`);
  } catch (e) {
    console.error('Bird flu ingest error', e);
    process.exit(1);
  }
})(); 