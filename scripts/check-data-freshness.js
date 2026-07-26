/**
 * One-off health check: latest row per Supabase table used by eggs.live pipelines.
 * Run: node scripts/check-data-freshness.js
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

/** @type {{ table: string, dateCol: string, workflow?: string, expectDays?: number }[]} */
const CHECKS = [
  { table: 'kroger_egg_prices_new', dateCol: 'captured_date', workflow: 'Kroger Egg Prices', expectDays: 2 },
  { table: 'target_egg_price_stats', dateCol: 'captured_date', workflow: 'Target Egg Prices', expectDays: 2 },
  { table: 'usda_weekly_egg_prices', dateCol: 'report_end_date', workflow: 'National Daily (USDA)', expectDays: 14 },
  { table: 'FRED', dateCol: 'ref_date', workflow: 'National Historical (FRED)', expectDays: 45 },
  { table: 'hpai_detections', dateCol: 'captured_at', workflow: 'HPAI Detections Fetcher (APHIS dashboard)', expectDays: 2 },
  { table: 'egg_news_articles', dateCol: 'published_at', workflow: '(no GH workflow — manual?)', expectDays: 7 },
  { table: 'cdc_bird_flu_summary', dateCol: 'as_of_date', workflow: '(no GH workflow — manual?)', expectDays: 14 },
];

function daysAgo(isoOrDate) {
  if (!isoOrDate) return null;
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (24 * 60 * 60 * 1000));
}

function status(days, expectDays) {
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
  const row = data?.[0];
  return { latest: row?.[dateCol] ?? null };
}

async function countRows(table) {
  const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true });
  if (error) return { error: error.message };
  return { count };
}

console.log('\nEGGS.LIVE — Supabase data freshness\n');
console.log(`Checked at: ${new Date().toISOString()}\n`);

const rows = [];
for (const check of CHECKS) {
  const [latestRes, countRes] = await Promise.all([
    latestFor(check.table, check.dateCol),
    countRows(check.table),
  ]);
  if (latestRes.error) {
    rows.push({
      table: check.table,
      workflow: check.workflow,
      latest: `ERROR: ${latestRes.error}`,
      days: '—',
      status: 'ERROR',
      rows: countRes.error ? '?' : countRes.count,
    });
    continue;
  }
  const days = daysAgo(latestRes.latest);
  rows.push({
    table: check.table,
    workflow: check.workflow,
    latest: latestRes.latest ?? '(empty)',
    days: days === null ? '—' : String(days),
    status: status(days, check.expectDays),
    rows: countRes.error ? '?' : countRes.count,
  });
}

const col = (s, w) => String(s).padEnd(w);
const wTable = 28;
const wWf = 32;
console.log(
  col('TABLE', wTable) +
    col('LATEST', 12) +
    col('DAYS AGO', 10) +
    col('STATUS', 12) +
    col('ROWS', 8) +
    'WORKFLOW'
);
console.log('-'.repeat(110));
for (const r of rows) {
  console.log(
    col(r.table, wTable) +
      col(r.latest, 12) +
      col(r.days, 10) +
      col(r.status, 12) +
      col(r.rows, 8) +
      r.workflow
  );
}

console.log('\nGitHub Actions workflows (repo: atlasacopian/eggs.live):');
console.log('  • Kroger Egg Prices      — daily ~08:00 UTC');
console.log('  • Target Egg Prices      — daily ~07:05 UTC');
console.log('  • National Daily (USDA)  — daily 16:00 UTC');
console.log('  • National Historical (FRED) — daily 07:00 UTC');
console.log('  • HPAI State Fetcher     — daily 07:10 UTC');
console.log('\nTables with no workflow: news, CDC — only update if run manually.\n');
