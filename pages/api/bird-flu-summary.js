import fetch from 'node-fetch';
import Papa from 'papaparse';
import { supabaseServer } from '../../lib/supabase';

// USDA Tableau CSV endpoint for HPAI confirmed detections
const CSV_URL = 'https://publicdashboards.dl.usda.gov/t/MRP_PUB/views/VS_Avian_HPAIConfirmedDetections2022/HPAI2022ConfirmedDetections?%3Aformat=csv';

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

    // 2) Fallback to live CSV if Supabase empty -----------------------------
    if (rows.length === 0) {
      const response = await fetch(CSV_URL);
      if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);
      const csvText = await response.text();
      const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      rows = data.map(r => ({
        report_date    : r['Confirmed'],
        birds_affected : Number(String(r['Birds Affected'] || '0').replace(/,/g, '')),
        depop_status   : r['Control Area Released']
      }));
    }

    // 3) Aggregate stats ----------------------------------------------------
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const weekAgoStr = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const ytdStartStr = new Date(today.getFullYear(), 0, 1).toISOString().slice(0, 10);

    const stats = {
      todayOutbreaks: 0,
      todayBirds: 0,
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
        if (culled) stats.birdsCulledYTD += birds; else stats.birdsPending += birds;
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
    return res.status(200).json({ ...stats, lastUpdated: todayStr, source: rows.length ? 'supabase' : 'csv' });
  } catch (e) {
    console.error('Bird-flu API error', e);
    return res.status(500).json({ error: e.message });
  }
} 