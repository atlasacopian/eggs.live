import { supabaseServer } from '../../../lib/supabase';
import { NextResponse } from 'next/server';

// This is a NEW, simpler route specifically for chart history
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  // IMPORTANT: We expect the *store identifier* passed directly
  const storeIdentifier = searchParams.get('storeIdentifier'); 

  if (!storeIdentifier) {
    return NextResponse.json({ error: 'Missing storeIdentifier parameter' }, { status: 400 });
  }

  console.log(`[simple-store-history] Fetching history for: ${storeIdentifier}`);

  const sb = supabaseServer();

  let historyData = [];
  // If the identifier is all digits, treat as Target store_id
  if (/^\d+$/.test(storeIdentifier)) {
    // Query Target stats
    const { data, error } = await sb
      .from('target_egg_price_stats')
      .select('captured_date, avg_price, product_type')
      .eq('store_id', storeIdentifier)
      .order('captured_date', { ascending: true });
    if (error) {
      console.error('[simple-store-history] Supabase error (target):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // Map to chart format: group by date
    const byDate = {};
    for (const item of data) {
      if (!byDate[item.captured_date]) byDate[item.captured_date] = { date: item.captured_date };
      byDate[item.captured_date][item.product_type] = item.avg_price;
    }
    historyData = Object.values(byDate);
  } else {
    // Query LA stats (existing logic)
    const { data, error } = await sb
      .from('la_egg_prices')
      .select('date, avg_regular_dozen_price, avg_organic_dozen_price')
      .eq('store_identifier', storeIdentifier)
      .order('date', { ascending: true });
    if (error) {
      console.error('[simple-store-history] Supabase error (la):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    historyData = data.map(item => ({
      date: item.date,
      regular: item.avg_regular_dozen_price,
      organic: item.avg_organic_dozen_price,
    }));
  }

  console.log(`[simple-store-history] Found ${historyData.length} records for ${storeIdentifier}`);

  return NextResponse.json({ history: historyData });
} 