import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Get today's date and one year ago
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const formatDate = (date) => date.toISOString().split('T')[0];

    const { data: regularData, error: regularError } = await sb
      .from('usda_weekly_egg_prices')
      .select('report_end_date, price')
      .eq('product_type', 'regular')
      .gte('report_end_date', formatDate(oneYearAgo))
      .lte('report_end_date', formatDate(today))
      .order('report_end_date', { ascending: true });

    if (regularError) throw regularError;

    const { data: organicData, error: organicError } = await sb
      .from('usda_weekly_egg_prices')
      .select('report_end_date, price')
      .eq('product_type', 'organic')
      .gte('report_end_date', formatDate(oneYearAgo))
      .lte('report_end_date', formatDate(today))
      .order('report_end_date', { ascending: true });

    if (organicError) throw organicError;

    // Assuming 'price' is the national average we want to chart
    const formattedRegular = regularData.map(d => ({ date: d.report_end_date, value: d.price }));
    const formattedOrganic = organicData.map(d => ({ date: d.report_end_date, value: d.price }));

    return NextResponse.json({
      priceHistoryRegular: formattedRegular,
      priceHistoryOrganic: formattedOrganic,
      // Market share data would need a different source or calculation
      // For now, let's omit it or send placeholder if BloombergTerminal expects it
    });

  } catch (error) {
    console.error('Error fetching national egg stats:', error);
    return NextResponse.json({ error: 'Failed to fetch national egg stats', details: error.message }, { status: 500 });
  }
} 