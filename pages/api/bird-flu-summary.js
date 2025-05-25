import fetch from 'node-fetch';
import Papa from 'papaparse';

// USDA Tableau CSV endpoint for HPAI confirmed detections
const CSV_URL = 'https://publicdashboards.dl.usda.gov/t/MRP_PUB/views/VS_Avian_HPAIConfirmedDetections2022/HPAI2022ConfirmedDetections?%3Aformat=csv';

export default async function handler(req, res) {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);
    const csvText = await response.text();
    const { data } = Papa.parse(csvText, { header: true, skipEmptyLines: true });

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
      birdsPending: 0,
    };

    data.forEach(row => {
      // Parse the confirmed date to ISO string
      const dateStr = row['Confirmed'];
      const d = new Date(dateStr);
      if (isNaN(d)) return;
      const isoDate = d.toISOString().slice(0, 10);

      // Birds affected count
      const birds = Number(String(row['Birds Affected'] || '0').replace(/,/g, ''));
      // Control Area Released indicates culled if non-empty
      const released = String(row['Control Area Released'] || '').trim();
      const culled = released !== '';
      const pending = !culled;

      // Year-to-date counts
      if (isoDate >= ytdStartStr) {
        stats.ytdOutbreaks++;
        stats.ytdBirds += birds;
        if (culled) stats.birdsCulledYTD += birds;
        else stats.birdsPending += birds;
      }
      // 7-day counts
      if (isoDate >= weekAgoStr) {
        stats.weekOutbreaks++;
        stats.weekBirds += birds;
      }
      // Today counts
      if (isoDate === todayStr) {
        stats.todayOutbreaks++;
        stats.todayBirds += birds;
      }
    });

    res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800');
    return res.status(200).json({ ...stats, lastUpdated: todayStr });
  } catch (e) {
    console.error('Bird-flu API error', e);
    return res.status(500).json({ error: e.message });
  }
} 