import { supabaseServer } from '@/lib/supabase';
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

  // Directly query la_egg_prices only
  const { data, error } = await sb
    .from('la_egg_prices')
    .select('date, avg_regular_dozen_price, avg_organic_dozen_price')
    .eq('store_identifier', storeIdentifier)
    .order('date', { ascending: true });

  if (error) {
    console.error('[simple-store-history] Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const historyData = data.map(item => ({
    date: item.date,
    regular: item.avg_regular_dozen_price,
    organic: item.avg_organic_dozen_price,
  }));

  console.log(`[simple-store-history] Found ${historyData.length} records for ${storeIdentifier}`);

  return NextResponse.json({ history: historyData });
} 