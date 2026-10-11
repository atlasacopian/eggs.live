/**
 * Health check for every Supabase table an eggs.live pipeline writes to.
 *
 * "Fresh" alone isn't enough for the store-price tables: the Target fetcher
 * wrote a fresh row for every store every night for months while RedSky was
 * bot-blocking all of them, so those rows were all NO_DATA_FOUND. For price
 * tables this also checks what share of stores on the latest day actually
 * came back with a price.
 *
 * Run: node scripts/check-data-freshness.js   (exits 1 if anything is off)
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_KEY } = process.env;
const key = SUPABASE_SERVICE_KEY || SUPABASE_KEY;
if (!SUPABASE_URL || !key) {
  console.error('Missing SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_KEY) in .env.local');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, key);

/**
 * dateCol: when the pipeline last wrote (fetch time where the table has one,
 *   since monthly/weekly sources legitimately publish with a lag).
 * minOkShare: price tables only - share of the latest day's store rows that
 *   must have status OK (Kroger normally sits ~92%, Erewhon 13/15).
 *
 * retired: pipeline intentionally stopped - shown, but never counted as a failure.
 *
 * @type {{ table: string, dateCol: string, workflow: string, expectDays: number, minOkShare?: number, retired?: boolean }[]}
 */
const CHECKS = [
  { table: 'kroger_egg_prices', dateCol: 'captured_date', workflow: 'Kroger Egg Prices', expectDays: 2, minOkShare: 0.8 },
  // Retired 2026-10-11 (PerimeterX-blocked; nightly schedule removed). History
  // is kept and still served, so only report on it - don't fail the check.
  { table: 'target_egg_prices', dateCol: 'captured_date', workflow: 'Target Egg Prices (retired)', expectDays: 2, retired: true },
  { table: 'erewhon_egg_prices', dateCol: 'captured_date', workflow: 'Erewhon Egg Prices', expectDays: 2, minOkShare: 0.5 },
  { table: 'usda_weekly_egg_prices', dateCol: 'report_end_date', workflow: 'National Daily (USDA)', expectDays: 14 },
  { table: 'hpai_detections', dateCol: 'captured_at', workflow: 'HPAI Detections Fetcher', expectDays: 2 },
  { table: 'feed_commodity_prices', dateCol: 'fetched_at', workflow: 'Feed Commodities (Corn + Soybean Meal)', expectDays: 2 },
  { table: 'usda_layer_inventory', dateCol: 'fetched_at', workflow: 'USDA Layer Inventory (NASS)', expectDays: 2 },
  { table: 'weather_risk_alerts', dateCol: 'fetched_at', workflow: 'Weather Risk (NWS Alerts)', expectDays: 1 },
];

function daysAgo(isoOrDate) {
  if (!isoOrDate) return null;
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}

function freshness(days, expectDays) {
  if (days === null) return 'NO DATA';
  if (days <= expectDays) return 'OK';
  if (days <= expectDays * 2) return 'STALE';
  return 'STOPPED?';
}

async function latestFor(table, dateCol) {
  const { data, error } = await sb
    .from(table)
    .select(dateCol)
    .order(dateCol, { ascending: false })
    .limit(1);
  if (error) return { error: error.message };
  return { latest: data?.[0]?.[dateCol] ?? null };
}

async function countRows(table, filter = (q) => q) {
  const { count, error } = await filter(sb.from(table).select('*', { count: 'exact', head: true }));
  return error ? null : count;
}

console.log('\nEGGS.LIVE — Supabase data health\n');
console.log(`Checked at: ${new Date().toISOString()}\n`);

const rows = [];
for (const check of CHECKS) {
  const [latestRes, total] = await Promise.all([latestFor(check.table, check.dateCol), countRows(check.table)]);
  if (latestRes.error) {
    rows.push({ ...check, latest: `ERROR: ${latestRes.error}`, days: '—', coverage: '—', status: 'ERROR', total: total ?? '?' });
    continue;
  }
  const days = daysAgo(latestRes.latest);
  let status = check.retired ? 'RETIRED' : freshness(days, check.expectDays);
  let coverage = '—';

  if (check.minOkShare != null && latestRes.latest) {
    const onDay = (q) => q.eq('captured_date', latestRes.latest);
    const [dayTotal, dayOk] = await Promise.all([
      countRows(check.table, onDay),
      countRows(check.table, (q) => onDay(q).eq('status', 'OK')),
    ]);
    if (dayTotal) {
      coverage = `${dayOk}/${dayTotal}`;
      if (status === 'OK' && dayOk < dayTotal * check.minOkShare) status = 'NO PRICES';
    }
  }

  rows.push({ ...check, latest: String(latestRes.latest ?? '(empty)').slice(0, 10), days: days ?? '—', coverage, status, total: total ?? '?' });
}

const col = (s, w) => String(s).padEnd(w);
console.log(
  col('TABLE', 26) + col('LATEST', 12) + col('DAYS', 6) + col('PRICED', 12) + col('STATUS', 11) + col('ROWS', 9) + 'WORKFLOW'
);
console.log('-'.repeat(120));
for (const r of rows) {
  console.log(
    col(r.table, 26) + col(r.latest, 12) + col(r.days, 6) + col(r.coverage, 12) + col(r.status, 11) + col(r.total, 9) + r.workflow
  );
}

const bad = rows.filter((r) => r.status !== 'OK' && r.status !== 'RETIRED');
console.log(bad.length ? `\n❌ ${bad.length} pipeline(s) need attention: ${bad.map((r) => r.table).join(', ')}\n` : '\n✅ All pipelines healthy\n');
process.exit(bad.length ? 1 : 0);
