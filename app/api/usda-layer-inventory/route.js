import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// One month back/forward from a 'YYYY-MM-01' string, staying on the 1st.
function shiftMonths(dateStr, delta) {
  const [y, m] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 10);
}

function pctChange(current, prior) {
  if (typeof current !== 'number' || typeof prior !== 'number' || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ ready: false, error: 'Missing Supabase configuration' }, { status: 500 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await sb
      .from('usda_layer_inventory')
      .select('reference_date, inventory_head, usda_load_time, fetched_at')
      .order('reference_date', { ascending: false });

    if (error) throw error;

    // Module is meant to only appear once the pipeline is genuinely
    // returning validated values - a missing/delayed USDA release, an empty
    // table, or a bad fetch should all just mean "not ready yet", not a
    // broken-looking module on the page.
    if (!data || data.length === 0) {
      return NextResponse.json({ ready: false });
    }

    const byDate = new Map(data.map(r => [r.reference_date, r]));
    const current = data[0];

    const momDate = shiftMonths(current.reference_date, -1);
    const yoyDate = shiftMonths(current.reference_date, -12);
    const momRow = byDate.get(momDate) || null;
    const yoyRow = byDate.get(yoyDate) || null;

    const momPct = momRow ? pctChange(current.inventory_head, momRow.inventory_head) : null;
    const yoyPct = yoyRow ? pctChange(current.inventory_head, yoyRow.inventory_head) : null;

    return NextResponse.json({
      ready: true,
      current: {
        value: current.inventory_head,
        referenceDate: current.reference_date,
      },
      momPct,
      yoyPct,
      source: 'USDA NASS',
      lastUpdated: current.usda_load_time || current.fetched_at,
      history: data
        .slice()
        .reverse()
        .map(r => ({ date: r.reference_date, value: r.inventory_head })),
    });
  } catch (err) {
    console.error('usda-layer-inventory error:', err);
    return NextResponse.json({ ready: false, error: err.message || 'Failed to fetch layer inventory' }, { status: 500 });
  }
}
