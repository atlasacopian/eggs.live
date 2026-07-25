import { supabaseServer } from '../lib/supabase';

// Regenerate once a day rather than on every sitemap request - the set of
// covered ZIPs changes slowly (only when store coverage changes), so there's
// no need to hit the DB on every crawl.
export const revalidate = 86400;

async function fetchAllZips(sb, table) {
  const zips = new Set();
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await sb.from(table).select('zip').range(from, from + pageSize - 1);
    if (error) {
      console.error(`sitemap: failed to read zips from ${table}`, error);
      break;
    }
    if (!data || !data.length) break;
    data.forEach(row => {
      if (row.zip) zips.add(String(row.zip).trim());
    });
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return zips;
}

export default async function sitemap() {
  const now = new Date();
  const entries = [
    {
      url: 'https://eggs.live',
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  try {
    const sb = supabaseServer();
    const [krogerZips, targetZips] = await Promise.all([
      fetchAllZips(sb, 'kroger_stores'),
      fetchAllZips(sb, 'target_stores'),
    ]);
    const allZips = new Set([...krogerZips, ...targetZips]);

    allZips.forEach(zip => {
      entries.push({
        url: `https://eggs.live/${zip}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    });
  } catch (e) {
    // If Supabase is unreachable at build/request time, still ship a sitemap
    // with just the homepage rather than failing the whole route.
    console.error('sitemap: failed to load store ZIPs', e);
  }

  return entries;
}
