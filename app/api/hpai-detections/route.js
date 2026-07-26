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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoIso = thirtyDaysAgo.toISOString().split('T')[0];

    const [totalsRes, recentRes, last30Res] = await Promise.all([
      sb.rpc('hpai_detection_totals'),
      sb
        .from('hpai_detections')
        .select('state, county, production, flock_type, confirmed_date, is_active, birds_affected')
        .order('confirmed_date', { ascending: false })
        .limit(15),
      sb
        .from('hpai_detections')
        .select('flock_type, birds_affected', { count: 'exact' })
        .gte('confirmed_date', thirtyDaysAgoIso),
    ]);

    if (recentRes.error) throw recentRes.error;
    if (last30Res.error) throw last30Res.error;

    // hpai_detection_totals is a Postgres function (see database/002) that
    // aggregates server-side so counts aren't capped by PostgREST's default
    // row limit.
    let totals = totalsRes.data?.[0];
    if (totalsRes.error || !totals) {
      totals = null;
    }

    return NextResponse.json({
      totals: totals && {
        totalFlocks: Number(totals.total_flocks),
        commercialFlocks: Number(totals.commercial_flocks),
        backyardFlocks: Number(totals.backyard_flocks),
        totalBirdsAffected: Number(totals.total_birds_affected),
        activeFlocks: Number(totals.active_flocks),
      },
      last30Days: {
        newDetections: last30Res.count ?? last30Res.data.length,
        birdsAffected: last30Res.data.reduce((sum, r) => sum + (r.birds_affected || 0), 0),
      },
      recent: recentRes.data,
    });
  } catch (error) {
    console.error('Error fetching HPAI detections:', error);
    return NextResponse.json({ error: 'Failed to fetch HPAI detections', details: error.message }, { status: 500 });
  }
}
