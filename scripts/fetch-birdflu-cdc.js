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

// CDC CSV endpoints discovered from page JSON configs (update if CDC changes)
const EXPOSURE_CONFIRMED_CSV = 'https://www.cdc.gov/bird-flu/modules/situation-summary/h5-exposure-source-data-confirmed.csv';
const EXPOSURE_PROBABLE_CSV  = 'https://www.cdc.gov/bird-flu/modules/situation-summary/h5-exposure-source-data-probable.csv';
const SUMMARY_CSV            = 'https://www.cdc.gov/bird-flu/modules/situation-summary/h5-current-data-bites-text.csv';

async function downloadCsv(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download CSV ${url}: ${res.status}`);
  const csvText = await res.text();
  const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return data;
}

(async () => {
  try {
    // Capture date/time
    const captured_at = new Date();
    const captured_date = captured_at.toISOString().split('T')[0];

    /* ----------------- Summary bites ------------------ */
    const summaryRows = await downloadCsv(SUMMARY_CSV);
    // Prepare rows for upsert into cdc_bird_flu_summary (label primary key + date)
    const summary = summaryRows.map(r => ({
      label: r['Label'],
      text: r['Text'] || null,
      value: r['Data'] || null,
      captured_date,
      captured_at: captured_at.toISOString()
    }));

    await sb.from('cdc_bird_flu_summary').upsert(summary, {
      onConflict: 'label,captured_date'
    });
    console.log(`✅ Upserted ${summary.length} summary rows`);

    /* ----------------- Exposure data ------------------ */
    const confirmed = await downloadCsv(EXPOSURE_CONFIRMED_CSV);
    const probable  = await downloadCsv(EXPOSURE_PROBABLE_CSV);

    function mapExposure(row, status) {
      return {
        captured_date,
        captured_at: captured_at.toISOString(),
        status, // 'confirmed' or 'probable'
        state: row['State'],
        dairy_herds: parseInt((row['Dairy Herds'] || '0').replace(/,/g, ''), 10),
        poultry_farms: parseInt((row['Poultry Farms and Culling Operations'] || '0').replace(/,/g, ''), 10),
        other_animal: parseInt((row['Other Animal Exposure'] || '0').replace(/,/g, ''), 10),
        unknown: parseInt((row['Exposure Source Unknown'] || '0').replace(/,/g, ''), 10),
        state_total: parseInt((row['State Total'] || '0').replace(/,/g, ''), 10),
        category: row['Category'] || null
      };
    }

    const exposureRows = [
      ...confirmed.map(r => mapExposure(r, 'confirmed')),
      ...probable.map(r => mapExposure(r, 'probable'))
    ];

    await sb.from('cdc_bird_flu_exposures').upsert(exposureRows, {
      onConflict: 'captured_date,status,state'
    });
    console.log(`✅ Upserted ${exposureRows.length} exposure rows`);
  } catch (e) {
    console.error('CDC bird flu ingest error', e);
    process.exit(1);
  }
})(); 