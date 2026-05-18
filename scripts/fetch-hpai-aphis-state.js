/**
 * Daily HPAI state aggregates for hpai_state_daily_stats.
 *
 * APHIS retired the by-state CSVs under animal_health/downloads/... (404).
 * CDC publishes the same commercial/backyard flock detections (USDA-sourced):
 * https://www.cdc.gov/bird-flu/modules/situation-summary/commercial-backyard-flocks.csv
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import fetch from 'node-fetch';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

const FLOCK_CSV =
  'https://www.cdc.gov/bird-flu/modules/situation-summary/commercial-backyard-flocks.csv';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function parseOutbreakDate(raw) {
  if (!raw) return null;
  const [mm, dd, yyyy] = String(raw).trim().split('-');
  if (!mm || !dd || !yyyy) return null;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

function parseFlockSize(raw) {
  const n = Number(String(raw ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

async function fetchFlockRows() {
  const res = await fetch(FLOCK_CSV, {
    headers: { 'User-Agent': 'eggs.live-data-pipeline/1.0' },
  });
  if (!res.ok) {
    throw new Error(`Failed to download ${FLOCK_CSV}: ${res.status}`);
  }
  const text = await res.text();
  return Papa.parse(text, { header: true, skipEmptyLines: true }).data;
}

function aggregateByState(rows) {
  /** @type {Map<string, { outbreaks: number, birds_total: number, last_detection: string | null }>} */
  const byState = new Map();

  for (const row of rows) {
    const state = (row.State || row.state || '').trim();
    if (!state) continue;

    const flockSize = parseFlockSize(row['Flock Size'] ?? row.flock_size);
    const outbreakIso = parseOutbreakDate(row['Outbreak Date'] ?? row.outbreak_date);

    const cur = byState.get(state) ?? {
      outbreaks: 0,
      birds_total: 0,
      last_detection: null,
    };
    cur.outbreaks += 1;
    cur.birds_total += flockSize;
    if (
      outbreakIso &&
      (!cur.last_detection || outbreakIso > cur.last_detection)
    ) {
      cur.last_detection = outbreakIso;
    }
    byState.set(state, cur);
  }

  return byState;
}

(async () => {
  try {
    const today = new Date();
    const captured_date = today.toISOString().split('T')[0];
    const captured_at = today.toISOString();

    const rows = await fetchFlockRows();
    if (!rows.length) {
      throw new Error('CDC flock CSV returned no rows');
    }

    const byState = aggregateByState(rows);
    const mapped = [...byState.entries()].map(([state, stats]) => ({
      state,
      captured_date,
      captured_at,
      outbreaks: stats.outbreaks,
      birds_total: stats.birds_total,
      birds_culled: 0,
      birds_pending_cull: 0,
      last_detection: stats.last_detection,
    }));

    const { error } = await sb.from('hpai_state_daily_stats').upsert(mapped, {
      onConflict: 'state,captured_date',
    });
    if (error) throw error;

    console.log(
      `✅ Upserted ${mapped.length} state HPAI rows (${rows.length} flock records from CDC/USDA)`
    );
  } catch (e) {
    console.error('HPAI ingest error', e);
    process.exit(1);
  }
})();
