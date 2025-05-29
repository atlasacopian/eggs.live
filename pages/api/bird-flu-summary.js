import { supabaseServer } from '../../lib/supabase';

export default async function handler(req, res) {
  try {
    const sb = supabaseServer();

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const monthStartStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const ytdStartStr = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);

    // Get today's row from daily stats
    const { data: todayRow, error: todayErr } = await sb
      .from('bird_flu_daily_stats')
      .select('*')
      .eq('day', todayStr)
      .single();
    if (todayErr && todayErr.code !== 'PGRST116' && todayErr.code !== 'PGRST103') throw todayErr;

    // Aggregate month & year directly in SQL
    const { data: aggRows, error: aggErr } = await sb.rpc('bird_flu_range_summary', {
      start_date: ytdStartStr,
      month_start: monthStartStr,
      today_date: todayStr
    });

    // If the RPC isn't present, fall back to client-side sums
    let monthOutbreaks = 0;
    let ytdOutbreaks = 0;
    let birdsPending = 0;
    if (aggErr || !aggRows || aggRows.length === 0) {
      const { data: raw, error: rawErr } = await sb
        .from('bird_flu_daily_stats')
        .select('day,outbreaks,birds_pending_cull')
        .gte('day', ytdStartStr);
      if (rawErr) throw rawErr;
      raw.forEach(r => {
        ytdOutbreaks += r.outbreaks;
        birdsPending += r.birds_pending_cull;
        if (r.day >= monthStartStr) monthOutbreaks += r.outbreaks;
      });
    } else {
      // RPC result has pre-computed sums
      const m = aggRows.find(r => r.label === 'month');
      const y = aggRows.find(r => r.label === 'year');
      monthOutbreaks = m ? m.outbreaks : 0;
      ytdOutbreaks = y ? y.outbreaks : 0;
      birdsPending = y ? y.birds_pending_cull : 0;
    }

    const response = {
      outbreaksToday: todayRow?.outbreaks || 0,
      outbreaksThisMonth: monthOutbreaks,
      outbreaksThisYear: ytdOutbreaks,
      birdsPendingCull: birdsPending,
      lastUpdated: todayStr
    };

    res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800');
    return res.status(200).json(response);
  } catch (e) {
    console.error('Bird-flu summary API error', e);
    return res.status(500).json({ error: e.message });
  }
} 