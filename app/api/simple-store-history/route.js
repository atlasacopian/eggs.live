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

  let sb;
  try {
    sb = supabaseServer();
  } catch (e) {
    console.warn('Supabase env vars missing – falling back to production API');
    try {
      const prodUrl = `https://eggs.live/api/simple-store-history?storeIdentifier=${encodeURIComponent(storeIdentifier)}`;
      const prodRes = await fetch(prodUrl, { next: { revalidate: 60 } });
      if (prodRes.ok) {
        const prodJson = await prodRes.json();
        return NextResponse.json(prodJson);
      }
      console.warn('Prod fallback failed, status', prodRes.status);
    } catch (err) {
      console.error('Prod fallback error', err);
    }
    // EARLY RETURN: Do not continue if fallback is used
    return NextResponse.json({ history: [], error: 'No data (fallback failed)' });
  }

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
  } else if (/^K\d+$/.test(storeIdentifier)) {
    // Kroger: try both 'K12345' and '12345'
    let data, error;
    // Try with 'K' prefix
    ({ data, error } = await sb
      .from('kroger_egg_prices_new')
      .select('captured_date, regular_avg, organic_avg')
      .eq('location_id', storeIdentifier)
      .order('captured_date', { ascending: true }));
    if (error) {
      console.error('[simple-store-history] Supabase error (kroger K-prefixed):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) {
      // Try without 'K' prefix
      const idNoK = storeIdentifier.slice(1);
      const { data: dataNoK, error: errorNoK } = await sb
        .from('kroger_egg_prices_new')
        .select('captured_date, regular_avg, organic_avg')
        .eq('location_id', idNoK)
        .order('captured_date', { ascending: true });
      if (errorNoK) {
        console.error('[simple-store-history] Supabase error (kroger no K):', errorNoK);
        return NextResponse.json({ error: errorNoK.message }, { status: 500 });
      }
      data = dataNoK;
    }
    console.log(`[simple-store-history] Kroger storeIdentifier: ${storeIdentifier}`);

    // Log data fetched for Kroger stores
    console.log(`[simple-store-history] Kroger data fetched:`, data);

    // Log if no data is found
    if (!data || data.length === 0) {
      console.warn(`[simple-store-history] No data found for Kroger storeIdentifier: ${storeIdentifier}`);
    }
    historyData = (data || []).map(item => ({
      date: item.captured_date,
      regular: item.regular_avg,
      organic: item.organic_avg,
    }));
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