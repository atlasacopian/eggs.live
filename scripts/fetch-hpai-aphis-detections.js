/**
 * Row-level HPAI (bird flu) flock detections, scraped directly from APHIS's
 * own public Tableau dashboard embedded at:
 * https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza/hpai-detections/commercial-backyard-flocks
 *
 * The dashboard (publicdashboards.dl.usda.gov, Tableau Server) requires an
 * authenticated vizql session handshake to export data, so a real browser
 * (Playwright) drives the same "Download > Crosstab > CSV" flow a human
 * would use, rather than reverse-engineering Tableau's session protocol.
 *
 * hpai_state_daily_stats (fetch-hpai-aphis-state.js) sources from a CDC CSV
 * mirror that stopped updating past mid-2025; this table is the current,
 * county-level replacement.
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import fs from 'fs';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const PAGE_URL =
  'https://www.aphis.usda.gov/livestock-poultry-disease/avian/avian-influenza/hpai-detections/commercial-backyard-flocks';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function parseConfirmedDate(raw) {
  // "13-Jul-26" -> "2026-07-13"
  const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
  const m = String(raw).trim().match(/^(\d{2})-([A-Za-z]{3})-(\d{2})$/);
  if (!m) return null;
  const [, dd, mon, yy] = m;
  const mm = MONTHS[mon];
  if (!mm) return null;
  return `20${yy}-${mm}-${dd}`;
}

function parseBirdsAffected(raw) {
  const n = Number(String(raw ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function classifyFlockType(production) {
  return /^Commercial/i.test(String(production ?? '').trim()) ? 'commercial' : 'backyard';
}

async function downloadCrosstabCsv() {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ acceptDownloads: true });
    await page.goto(PAGE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const frameHandle = await page.waitForSelector('iframe.iframe-embed__iframe', { timeout: 30000 });
    const frame = await frameHandle.contentFrame();
    if (!frame) throw new Error('Could not access Tableau iframe content');

    // Toolbar takes a few seconds to finish rendering (WASM viz renderer).
    await frame.waitForSelector('[data-tb-test-id="viz-viewer-toolbar-button-download"]', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Toolbar "Download" button, then "Crosstab" menu item.
    await frame.locator('[data-tb-test-id="viz-viewer-toolbar-button-download"]').click();
    await frame.getByText('Crosstab', { exact: true }).click();

    // Export dialog: select CSV, then click Download, capturing the file.
    // The custom-styled <label> intercepts pointer events, not the <input>.
    await frame.locator('[data-tb-test-id="crosstab-options-dialog-radio-csv-Label"]').click();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      frame.locator('[data-tb-test-id="export-crosstab-export-Button"]').click(),
    ]);

    const tmpPath = '/tmp/hpai-crosstab.csv';
    await download.saveAs(tmpPath);
    return tmpPath;
  } finally {
    await browser.close();
  }
}

function parseCrosstab(filePath) {
  // Tableau exports this crosstab as UTF-16LE, tab-separated. Column order
  // isn't guaranteed to be stable across APHIS dashboard edits (they've
  // inserted new columns before), so look columns up by name rather than
  // trusting a fixed position.
  const buf = fs.readFileSync(filePath);
  const text = buf.toString('utf16le').replace(/^﻿/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const header = lines[0].split('\t');
  const REQUIRED = ['Special ID', 'County Name', 'State', 'Production', 'Confirmed Diagnosis', 'Control Area Released', 'Birds Affected'];
  const colIndex = {};
  for (const name of REQUIRED) {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`Crosstab is missing expected column "${name}". Header: ${header.join(', ')}`);
    colIndex[name] = i;
  }

  const rows = [];
  for (const line of lines.slice(1)) {
    const cols = line.split('\t');
    const specialId = cols[colIndex['Special ID']];
    const county = cols[colIndex['County Name']];
    const state = cols[colIndex['State']];
    const production = cols[colIndex['Production']];
    const confirmedRaw = cols[colIndex['Confirmed Diagnosis']];
    const controlArea = cols[colIndex['Control Area Released']];
    const birdsRaw = cols[colIndex['Birds Affected']];
    const confirmed_date = parseConfirmedDate(confirmedRaw);
    if (!confirmed_date) continue;

    rows.push({
      special_id: specialId,
      county,
      state,
      production,
      flock_type: classifyFlockType(production),
      confirmed_date,
      control_area_released: controlArea,
      is_active: String(controlArea).trim() === 'Active',
      birds_affected: parseBirdsAffected(birdsRaw),
      captured_at: new Date().toISOString(),
    });
  }
  return rows;
}

(async () => {
  try {
    const csvPath = await downloadCrosstabCsv();
    const rows = parseCrosstab(csvPath);
    if (!rows.length) throw new Error('Parsed 0 rows from crosstab export');

    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await sb
        .from('hpai_detections')
        .upsert(rows.slice(i, i + CHUNK), { onConflict: 'special_id,state,county,confirmed_date' });
      if (error) throw error;
    }

    console.log(`✅ Upserted ${rows.length} HPAI detection rows from APHIS dashboard`);
  } catch (e) {
    console.error('HPAI detections ingest error', e);
    process.exit(1);
  }
})();
