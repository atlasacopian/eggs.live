import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Aggregates to ~10s server-side (see database/005_create_state_price_stats.sql) -
// cache it for an hour rather than recomputing on every page load.
export const revalidate = 3600;

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Target's own price scraper has been returning null prices for ~2
    // months, so a 30-day window leaves most Target-only states blank. A
    // 365-day lookback reaches back to real pre-outage data for nearly every
    // state (49 of 51) instead - still real captured prices, just not all
    // equally fresh. Only a couple of near-zero-store states (VT, WY) have
    // no price history at any lookback.
    const { data, error } = await sb.rpc('state_price_stats', { lookback_days: 365 });
    if (error) throw error;
    const states = (data || []).map(row => ({
      state: row.state,
      storeCount: row.store_count,
      sampleZip: row.sample_zip,
      avgRegular: row.avg_regular != null ? Number(row.avg_regular) : null,
      avgOrganic: row.avg_organic != null ? Number(row.avg_organic) : null,
      volatilityRegular: row.volatility_regular != null ? Number(row.volatility_regular) : null,
      volatilityOrganic: row.volatility_organic != null ? Number(row.volatility_organic) : null,
    }));

    return NextResponse.json({ states });
  } catch (err) {
    console.error('state-price-stats error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch state price stats' }, { status: 500 });
  }
}
