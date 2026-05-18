import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

/** CDN + browser: one shared copy, refresh at most every hour (not per visitor). */
const CACHE_CONTROL =
  'public, s-maxage=3600, stale-while-revalidate=86400, max-age=300';

const PRIORITY_SOURCES = [
  'Reuters','Associated Press','AP','Bloomberg','The Wall Street Journal','WSJ','The New York Times','CNN','BBC','NBC News','CBS News','ABC News','Fox News','Financial Times','CNBC','The Washington Post'
];

const QUERY = 'egg price';

/** @returns {Promise<{ title: string, url: string, publishedAt: string, source: string }[]>} */
async function fetchSerpHouseArticles(apiKey) {
  const url = new URL('https://api.serphouse.com/serp/live');
  url.searchParams.set('q', QUERY);
  url.searchParams.set('serp_type', 'news');
  url.searchParams.set('domain', 'google.com');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('device', 'desktop');
  url.searchParams.set('num_result', '30');
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error('SerpHouse response not ok', res.status, await res.text().catch(() => ''));
    return [];
  }
  const j = await res.json().catch(() => ({}));
  const arr = j.results?.results?.news || [];
  return arr.map((n) => ({
    title: n.title,
    url: n.url,
    publishedAt: n.time || new Date().toISOString(),
    source: n.channel || 'Unknown',
  }));
}

/** @returns {Promise<{ title: string, url: string, publishedAt: string, source: string }[]>} */
async function fetchGNewsArticles(apiKey) {
  const u = new URL('https://gnews.io/api/v4/search');
  u.searchParams.set('q', QUERY);
  u.searchParams.set('lang', 'en');
  u.searchParams.set('max', '30');
  u.searchParams.set('token', apiKey);
  const res = await fetch(u.toString(), { cache: 'no-store' });
  if (!res.ok) {
    console.error('GNews response not ok', res.status, await res.text().catch(() => ''));
    return [];
  }
  const j = await res.json().catch(() => ({ articles: [] }));
  const arr = j.articles || [];
  return arr.map((a) => ({
    title: a.title,
    url: a.url,
    publishedAt: a.publishedAt || new Date().toISOString(),
    source: a.source?.name || a.source || 'Unknown',
  }));
}

async function fetchNewsFromProviders() {
  const startTime = Date.now();
  const { SERPHOUSE_API_KEY, GNEWS_API_KEY } = process.env;

  let raw = [];
  let apiSource = 'Unknown';

  if (SERPHOUSE_API_KEY) {
    raw = await fetchSerpHouseArticles(SERPHOUSE_API_KEY);
    apiSource = 'SERPHouse';
  }

  if (raw.length === 0 && GNEWS_API_KEY) {
    raw = await fetchGNewsArticles(GNEWS_API_KEY);
    apiSource = SERPHOUSE_API_KEY ? 'GNews (SerpHouse fallback)' : 'GNews';
  }

  console.log(`News provider fetch done in ${Date.now() - startTime}ms, raw count=${raw.length}, source=${apiSource}`);

  const seen = new Set();
  let articles = [];
  for (const a of raw) {
    const url = a.url;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    articles.push({
      title: a.title,
      url,
      publishedAt: a.publishedAt,
      source: a.source,
    });
  }

  const BAKING_REGEX = /(bake|baking|recipe|cookies?|cake|cakes|bread|brownies?|muffins?|cupcakes?)/i;
  articles = articles.filter((a) => !BAKING_REGEX.test(a.title));

  articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  articles.sort((a, b) => {
    const ia = PRIORITY_SOURCES.findIndex(
      (s) => a.source && a.source.toLowerCase().includes(s.toLowerCase())
    );
    const ib = PRIORITY_SOURCES.findIndex(
      (s) => b.source && b.source.toLowerCase().includes(s.toLowerCase())
    );
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
  articles = articles.slice(0, 60);

  return {
    articles,
    source: apiSource,
    lastFetched: new Date().toISOString(),
    count: articles.length,
  };
}

const getCachedNews = unstable_cache(fetchNewsFromProviders, ['egg-news-bundle'], {
  revalidate: 3600,
});

export async function GET() {
  const { SERPHOUSE_API_KEY, GNEWS_API_KEY } = process.env;
  if (!SERPHOUSE_API_KEY && !GNEWS_API_KEY) {
    return NextResponse.json(
      { error: 'Missing SERPHOUSE_API_KEY or GNEWS_API_KEY env' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const data = await getCachedNews();
    return NextResponse.json(
      {
        articles: data.articles,
        source: data.source,
        lastFetched: data.lastFetched,
        count: data.count,
      },
      { headers: { 'Cache-Control': CACHE_CONTROL } }
    );
  } catch (e) {
    return NextResponse.json(
      {
        error: 'News fetch failed',
        lastFetched: new Date().toISOString(),
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
