import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function shiftMonths(dateStr, delta) {
  const [y, m] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 10);
}

function pctChange(current, prior) {
  if (typeof current !== 'number' || typeof prior !== 'number' || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

// Builds one commodity's { ready, current, momPct, yoyPct, ... } block from
// its rows (already sorted newest-first). Same shape/logic as
// usda-layer-inventory's route - each commodity is independent, no blended
// index between them.
function buildSeries(rows) {
  if (!rows || rows.length === 0) return { ready: false };

  const byDate = new Map(rows.map(r => [r.reference_date, r]));
  const current = rows[0];
  const momRow = byDate.get(shiftMonths(current.reference_date, -1)) || null;
  const yoyRow = byDate.get(shiftMonths(current.reference_date, -12)) || null;

  return {
    ready: true,
    current: { value: current.value, referenceDate: current.reference_date },
    momPct: momRow ? pctChange(current.value, momRow.value) : null,
    yoyPct: yoyRow ? pctChange(current.value, yoyRow.value) : null,
    unit: current.unit,
    source: current.source,
    lastUpdated: current.source_load_time || current.fetched_at,
    history: rows.slice().reverse().map(r => ({ date: r.reference_date, value: r.value })),
  };
}

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ corn: { ready: false }, soybeanMeal: { ready: false }, error: 'Missing Supabase configuration' }, { status: 500 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await sb
      .from('feed_commodity_prices')
      .select('commodity, reference_date, value, unit, source, source_load_time, fetched_at')
      .order('reference_date', { ascending: false });

    if (error) throw error;

    const cornRows = (data || []).filter(r => r.commodity === 'corn');
    const soybeanMealRows = (data || []).filter(r => r.commodity === 'soybean_meal');

    return NextResponse.json({
      corn: buildSeries(cornRows),
      soybeanMeal: buildSeries(soybeanMealRows),
    });
  } catch (err) {
    console.error('feed-commodities error:', err);
    return NextResponse.json({ corn: { ready: false }, soybeanMeal: { ready: false }, error: err.message || 'Failed to fetch feed commodities' }, { status: 500 });
  }
}
