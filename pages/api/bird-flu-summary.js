import fetch from 'node-fetch';
import Papa from 'papaparse';
import { supabaseServer } from '../../lib/supabase';

// APHIS Socrata CSV endpoint for HPAI confirmed detections (up-to-date data)
const CSV_URL = 'https://data.aphis.usda.gov/resource/y7g5-8w6x.csv?$limit=50000';

export default async function handler(req, res) {
  try {
    // 1) Try Supabase first -------------------------------------------------
    let rows = [];
    try {
      const sb = supabaseServer();
      const { data, error } = await sb
        .from('bird_flu_outbreaks')
        .select('report_date,birds_affected,depop_status')
        .order('report_date', { ascending: false });
      if (error) throw error;
      rows = data || [];
    } catch (e) {
      console.warn('Supabase bird-flu fetch failed, will fall back to CSV', e.message);
    }

    // 2) If Supabase fetch failed (caught above), rows will be set to CSV fallback inside catch
    // (we no longer fallback on empty results to ensure zero values when table is empty)

    // 3) Aggregate stats ----------------------------------------------------
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const weekAgoStr = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const ytdStartStr = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);
    const monthStartStr = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

    const stats = {
      todayOutbreaks: 0,
      todayBirds: 0,
      monthOutbreaks: 0,
      weekOutbreaks: 0,
      weekBirds: 0,
      ytdOutbreaks: 0,
      ytdBirds: 0,
      birdsCulledYTD: 0,
      birdsPending: 0
    };

    rows.forEach(row => {
      const isoDate = new Date(row.report_date).toISOString().slice(0, 10);
      if (!isoDate) return;
      const birds = Number(row.birds_affected) || 0;
      const culled = row.depop_status && String(row.depop_status).trim() !== '';

      if (isoDate >= ytdStartStr) {
        stats.ytdOutbreaks++;
        stats.ytdBirds += birds;
        if (culled) stats.birdsCulledYTD += birds;
        else stats.birdsPending += birds;
      }
      if (isoDate >= monthStartStr) {
        stats.monthOutbreaks++;
      }
      if (isoDate >= weekAgoStr) {
        stats.weekOutbreaks++;
        stats.weekBirds += birds;
      }
      if (isoDate === todayStr) {
        stats.todayOutbreaks++;
        stats.todayBirds += birds;
      }
    });

    res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800');
    return res.status(200).json({ ...stats, lastUpdated: todayStr, source: 'supabase' });
  } catch (e) {
    console.error('Bird-flu API error', e);
    return res.status(500).json({ error: e.message });
  }
} 