import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import Parser from 'rss-parser';

/**
 * News providers (order): **GNews** (primary) → Google News RSS.
 * Set `GNEWS_API_KEY` in Vercel. Auth query param must be `apikey` (GNews v4).
 */
// Short browser cache so UI recovers quickly after API/env fixes; s-maxage caps edge reuse.
const CACHE_CONTROL =
  'public, s-maxage=300, stale-while-revalidate=120, max-age=0, must-revalidate';

const PRIORITY_SOURCES = [
  'Reuters','Associated Press','AP','Bloomberg','The Wall Street Journal','WSJ','The New York Times','CNN','BBC','NBC News','CBS News','ABC News','Fox News','Financial Times','CNBC','The Washington Post'
];

/** Google RSS fallback query */
const QUERY = 'egg price OR egg prices OR egg shortage';

// Simple phrases work more reliably than long OR chains; omit country for breadth (lang=en).
const GNEWS_SEARCH_QUERIES = [
  'egg price',
  'egg prices',
  'egg shortage',
  'avian flu poultry',
  'cal-maine foods',
  'USDA egg',
];

const RSS_UA =
  'Mozilla/5.0 (compatible; eggs.live/1.0; +https://eggs.live) AppleWebKit/537.36 (KHTML, like Gecko)';

/** One GNews search request; returns articles or []. */
async function fetchGNewsSearchOnce(apiKey, q, max) {
  const u = new URL('https://gnews.io/api/v4/search');
  u.searchParams.set('q', q);
  u.searchParams.set('lang', 'en');
  u.searchParams.set('max', String(max));
  u.searchParams.set('apikey', apiKey);
  const res = await fetch(u.toString(), { cache: 'no-store' });
  const bodyText = await res.text().catch(() => '');
  if (!res.ok) {
    console.error('GNews response not ok', q, res.status, bodyText.slice(0, 300));
    return [];
  }
  let j;
  try {
    j = JSON.parse(bodyText);
  } catch {
    console.error('GNews JSON parse failed', q, bodyText.slice(0, 200));
    return [];
  }
  if (j.errors?.length) {
    console.error('GNews API errors', q, j.errors);
    return [];
  }
  const arr = j.articles || [];
  return arr.map((a) => ({
    title: a.title,
    url: a.url,
    publishedAt: a.publishedAt || new Date().toISOString(),
    source: a.source?.name || a.source || 'Unknown',
  }));
}

/** Merge several US searches so we fill the UI (single queries often return very few rows). */
async function fetchGNewsArticles(apiKey) {
  const maxPer = 25;
  const batches = await Promise.all(
    GNEWS_SEARCH_QUERIES.map((q) => fetchGNewsSearchOnce(apiKey, q, maxPer))
  );
  return batches.flat();
}

/** Google News topic RSS — no API key; best-effort. */
async function fetchGoogleNewsRssArticles() {
  const u = new URL('https://news.google.com/rss/search');
  u.searchParams.set('q', QUERY);
  u.searchParams.set('hl', 'en-US');
  u.searchParams.set('gl', 'US');
  u.searchParams.set('ceid', 'US:en');

  const res = await fetch(u.toString(), {
    headers: {
      'User-Agent': RSS_UA,
      Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    console.error('Google News RSS HTTP', res.status);
    return [];
  }
  const xml = await res.text();
  const parser = new Parser();
  let feed;
  try {
    feed = await parser.parseString(xml);
  } catch (e) {
    console.error('Google News RSS parse error', e);
    return [];
  }

  return (feed.items || [])
    .map((item) => {
      const title = (item.title || '').trim();
      const link = (item.link || '').trim();
      let source = 'Google News';
      const dash = title.lastIndexOf(' - ');
      if (dash > 0 && dash < title.length - 3) {
        source = title.slice(dash + 3).trim() || source;
      }
      const pub =
        item.pubDate || item.isoDate || new Date().toISOString();
      return {
        title: dash > 0 ? title.slice(0, dash).trim() : title,
        url: link,
        publishedAt: pub,
        source,
      };
    })
    .filter((a) => a.title && a.url);
}

async function fetchNewsFromProviders() {
  const startTime = Date.now();
  const GNEWS_API_KEY = process.env.GNEWS_API_KEY?.trim();

  let raw = [];
  let gnewsHits = 0;

  if (GNEWS_API_KEY) {
    raw = await fetchGNewsArticles(GNEWS_API_KEY);
    gnewsHits = raw.length;
  }

  // Google News RSS usually returns many items; merge so we are not stuck on 1–2 syndicated GNews URLs.
  const rssArticles = await fetchGoogleNewsRssArticles();
  const seenBeforeRss = new Set(raw.map((a) => a.url).filter(Boolean));
  let rssAdded = 0;
  for (const a of rssArticles) {
    if (a.url && !seenBeforeRss.has(a.url)) {
      seenBeforeRss.add(a.url);
      raw.push(a);
      rssAdded++;
    }
  }

  let apiSource;
  if (gnewsHits > 0 && rssAdded > 0) apiSource = 'GNews + Google News RSS';
  else if (gnewsHits > 0) apiSource = 'GNews';
  else apiSource = 'Google News RSS';

  console.log(
    `News provider fetch done in ${Date.now() - startTime}ms, raw count=${raw.length}, source=${apiSource}`
  );

  const seen = new Set();
  const seenTitles = new Set();
  let articles = [];
  for (const a of raw) {
    const url = a.url;
    const title = typeof a.title === 'string' ? a.title.trim() : '';
    if (!url || !title || seen.has(url)) continue;
    const titleKey = title.toLowerCase().replace(/\s+/g, ' ').slice(0, 120);
    if (seenTitles.has(titleKey)) continue;
    seen.add(url);
    seenTitles.add(titleKey);
    articles.push({
      title,
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

const getCachedNews = unstable_cache(fetchNewsFromProviders, ['egg-news-bundle-v9-gnews-plus-rss'], {
  revalidate: 3600,
});

export async function GET() {
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
