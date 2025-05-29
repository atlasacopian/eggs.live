// scripts/aggregate-birdflu-stats.js
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

(async () => {
  try {
    // Determine range to summarise: last 35 days (safe window)
    const today = new Date();
    const past = new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000);
    const fromDate = past.toISOString().split('T')[0];

    /* ----------- overall daily stats ----------- */
    const { data: dailyRows, error: dailyErr } = await sb.rpc('bird_flu_daily_summary', { start_date: fromDate });
    if (dailyErr && dailyErr.code !== 'PGRST116') {
      // PGRST116 means function not found – fall back to client-side aggregate
      console.log('Supabase RPC not found; computing daily summary client-side');
    }

    // Fallback client-side aggregation (works even without RPC)
    if (!dailyRows || dailyRows.length === 0) {
      const { data: raw, error: rawErr } = await sb
        .from('bird_flu_outbreaks')
        .select('report_date,birds_affected,depop_status')
        .gte('report_date', fromDate);
      if (rawErr) throw rawErr;
      const map = new Map();
      for (const r of raw) {
        const day = String(r.report_date).slice(0, 10);
        if (!map.has(day)) map.set(day, { day, outbreaks: 0, birds_affected: 0, birds_pending_cull: 0 });
        const o = map.get(day);
        o.outbreaks += 1;
        o.birds_affected += r.birds_affected || 0;
        if (r.depop_status && r.depop_status.toLowerCase().startsWith('pending')) {
          o.birds_pending_cull += r.birds_affected || 0;
        }
      }
      const summaries = Array.from(map.values());
      if (summaries.length) {
        const { error: upErr } = await sb
          .from('bird_flu_daily_stats')
          .upsert(summaries, { onConflict: 'day' });
        if (upErr) throw upErr;
        console.log(`✅ Upserted ${summaries.length} daily stats rows`);
      } else {
        console.log('No daily stats to upsert');
      }
    } else {
      // If RPC returned rows, upsert them directly
      const { error: upErr } = await sb
        .from('bird_flu_daily_stats')
        .upsert(dailyRows, { onConflict: 'day' });
      if (upErr) throw upErr;
      console.log(`✅ Upserted ${dailyRows.length} daily stats rows (from RPC)`);
    }

    /* ----------- per-state daily stats ----------- */
    const { data: stateRows, error: stateErr } = await sb.rpc('bird_flu_state_daily_summary', { start_date: fromDate });

    if (!stateRows || stateRows.length === 0) {
      const { data: raw, error: rawErr } = await sb
        .from('bird_flu_outbreaks')
        .select('report_date,state,birds_affected,depop_status')
        .gte('report_date', fromDate);
      if (rawErr) throw rawErr;
      const map = new Map();
      for (const r of raw) {
        const day = String(r.report_date).slice(0, 10);
        const key = `${day}|${r.state}`;
        if (!map.has(key)) map.set(key, { day, state: r.state, outbreaks: 0, birds_affected: 0, birds_pending_cull: 0 });
        const o = map.get(key);
        o.outbreaks += 1;
        o.birds_affected += r.birds_affected || 0;
        if (r.depop_status && r.depop_status.toLowerCase().startsWith('pending')) {
          o.birds_pending_cull += r.birds_affected || 0;
        }
      }
      const summaries = Array.from(map.values());
      if (summaries.length) {
        const { error: upErr } = await sb
          .from('bird_flu_state_daily_stats')
          .upsert(summaries, { onConflict: 'day,state' });
        if (upErr) throw upErr;
        console.log(`✅ Upserted ${summaries.length} state-daily stats rows`);
      } else {
        console.log('No state-daily stats to upsert');
      }
    } else {
      const { error: upErr } = await sb
        .from('bird_flu_state_daily_stats')
        .upsert(stateRows, { onConflict: 'day,state' });
      if (upErr) throw upErr;
      console.log(`✅ Upserted ${stateRows.length} state-daily stats rows (from RPC)`);
    }
  } catch (e) {
    console.error('Aggregate stats error', e);
    process.exit(1);
  }
})(); 