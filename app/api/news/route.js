import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

/** CDN + browser: one shared copy, refresh at most every hour (not per visitor). */
const CACHE_CONTROL =
  'public, s-maxage=3600, stale-while-revalidate=86400, max-age=300';

const PRIORITY_SOURCES = [
  'Reuters','Associated Press','AP','Bloomberg','The Wall Street Journal','WSJ','The New York Times','CNN','BBC','NBC News','CBS News','ABC News','Fox News','Financial Times','CNBC','The Washington Post'
];

async function fetchNewsFromProviders() {
  const startTime = Date.now();
  const { SERPHOUSE_API_KEY, GNEWS_API_KEY } = process.env;
  let apiSource = 'Unknown';

  const QUERIES = ['egg price'];
  let fetchPromises;
  let parser;

  if (SERPHOUSE_API_KEY) {
    apiSource = 'SERPHouse';
    fetchPromises = QUERIES.map((q) => {
      const url = new URL('https://api.serphouse.com/serp/live');
      url.searchParams.set('q', q);
      url.searchParams.set('serp_type', 'news');
      url.searchParams.set('domain', 'google.com');
      url.searchParams.set('lang', 'en');
      url.searchParams.set('device', 'desktop');
      url.searchParams.set('num_result', '30');
      const headers = { Authorization: `Bearer ${SERPHOUSE_API_KEY}` };
      return fetch(url.toString(), { headers, cache: 'no-store' });
    });
    parser = async (res) => {
      if (!res.ok) {
        console.error('SerpHouse response not ok', res.status, await res.text().catch(() => ''));
        return { articles: [] };
      }
      const j = await res.json().catch(() => ({}));
      const arr = j.results?.results?.news || [];
      return {
        articles: arr.map((n) => ({
          title: n.title,
          url: n.url,
          publishedAt: n.time || new Date().toISOString(),
          source: n.channel || 'Unknown',
        })),
      };
    };
  } else {
    if (!GNEWS_API_KEY) {
      throw new Error('GNEWS_API_KEY missing');
    }
    apiSource = 'GNews';
    fetchPromises = QUERIES.map((q) =>
      fetch(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=30&token=${GNEWS_API_KEY}`,
        { cache: 'no-store' }
      )
    );
    parser = async (res) =>
      res.ok ? res.json().catch(() => ({ articles: [] })) : { articles: [] };
  }

  const responses = await Promise.all(fetchPromises);
  console.log(`Fetched all responses in ${Date.now() - startTime}ms`);

  const jsonArrays = await Promise.all(responses.map(parser));
  console.log(`Parsed all responses in ${Date.now() - startTime}ms`);

  const allArts = jsonArrays.flatMap((j) => j.articles || []);
  const seen = new Set();
  let articles = [];
  for (const a of allArts) {
    if (!a.url || seen.has(a.url)) continue;
    seen.add(a.url);
    articles.push({
      title: a.title,
      url: a.url,
      publishedAt: a.publishedAt,
      source: a.source?.name || a.source || 'Unknown',
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

  console.log(`Processed articles in ${Date.now() - startTime}ms`);

  return {
    articles,
    source: apiSource,
    lastFetched: new Date().toISOString(),
    count: articles.length,
  };
}

/** At most one SerpHouse/GNews fetch per hour for the whole app (per deploy region). */
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
