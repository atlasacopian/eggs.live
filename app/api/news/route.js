import { NextResponse } from 'next/server';

export const revalidate = 3600; // regenerate at most once per hour

const PRIORITY_SOURCES = [
  'Reuters','Associated Press','AP','Bloomberg','The Wall Street Journal','WSJ','The New York Times','CNN','BBC','NBC News','CBS News','ABC News','Fox News','Financial Times','CNBC','The Washington Post'
];

export async function GET() {
  const startTime = Date.now();
  console.log('Starting news fetch process');

  const { SERPHOUSE_API_KEY, GNEWS_API_KEY } = process.env;
  let apiSource = 'Unknown';
  
  try {
    const QUERIES = ['egg price','egg prices','egg price drop'];
    let fetchPromises;
    let parser;

    if (SERPHOUSE_API_KEY) {
      apiSource = 'SERPHouse';
      // Use SERPHouse Live endpoint for Google News results
      fetchPromises = QUERIES.map(q => {
        const url = new URL('https://api.serphouse.com/serp/live');
        url.searchParams.set('q', q);
        url.searchParams.set('serp_type', 'news');
        url.searchParams.set('domain', 'google.com');
        url.searchParams.set('lang', 'en');
        url.searchParams.set('device', 'desktop');
        url.searchParams.set('num_result', '30');
        const headers = { 'Authorization': `Bearer ${SERPHOUSE_API_KEY}` };
        return fetch(url.toString(), { headers, next: { revalidate: 3600 } });
      });
      parser = async (res) => {
        if (!res.ok) {
          console.error('SerpHouse response not ok', res.status, await res.text().catch(()=>''));
          return { articles: [] };
        }
        const j = await res.json().catch(() => ({}));
        const arr = j.results?.results?.news || [];
        return {
          articles: arr.map(n => ({
            title: n.title,
            url: n.url,
            publishedAt: n.time || new Date().toISOString(),
            source: n.channel || 'Unknown'
          }))
        };
      };
    } else {
      // Fallback to GNews
      if (!GNEWS_API_KEY) {
        return NextResponse.json({ error: 'Missing SERPHOUSE_API_KEY or GNEWS_API_KEY env' }, { status: 500 });
      }
      apiSource = 'GNews';
      fetchPromises = QUERIES.map(q =>
        fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=30&token=${GNEWS_API_KEY}`, { next: { revalidate: 3600 } })
      );
      parser = async (res)=> res.ok ? res.json().catch(()=>({articles:[]})) : {articles:[]};
    }

    const responses = await Promise.all(fetchPromises);
    console.log(`Fetched all responses in ${Date.now() - startTime}ms`);

    const jsonArrays = await Promise.all(responses.map(parser));
    console.log(`Parsed all responses in ${Date.now() - startTime}ms`);

    // merge & dedupe by url
    const allArts = jsonArrays.flatMap(j => j.articles || []);
    const seen = new Set();
    let articles = [];
    for (const a of allArts) {
      if (!a.url || seen.has(a.url)) continue;
      seen.add(a.url);
      articles.push({
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt,
        source: a.source?.name || a.source || 'Unknown'
      });
    }

    // filter out baking/recipe stories
    const BAKING_REGEX = /(bake|baking|recipe|cookies?|cake|cakes|bread|brownies?|muffins?|cupcakes?)/i;
    articles = articles.filter(a => !BAKING_REGEX.test(a.title));

    // newest first
    articles.sort((a,b)=> new Date(b.publishedAt) - new Date(a.publishedAt));

    // prioritise sources within the same timestamp order (stable sort approximation)
    articles.sort((a,b)=>{
      const ia = PRIORITY_SOURCES.findIndex(s => a.source && a.source.toLowerCase().includes(s.toLowerCase()));
      const ib = PRIORITY_SOURCES.findIndex(s => b.source && b.source.toLowerCase().includes(s.toLowerCase()));
      if (ia===-1 && ib===-1) return 0;
      if (ia===-1) return 1;
      if (ib===-1) return -1;
      return ia-ib;
    });

    // limit to 60 so payload small
    articles = articles.slice(0,60);

    console.log(`Processed articles in ${Date.now() - startTime}ms`);

    return NextResponse.json({ 
      articles,
      source: apiSource,
      lastFetched: new Date().toISOString(),
      count: articles.length
    });
  } catch (e) {
    return NextResponse.json({ 
      error: 'News fetch failed',
      source: apiSource,
      lastFetched: new Date().toISOString()
    }, { status: 500 });
  }
} 