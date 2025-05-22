import { NextResponse } from 'next/server';

export const revalidate = 3600; // regenerate at most once per hour

const PRIORITY_SOURCES = [
  'Reuters','Associated Press','AP','Bloomberg','The Wall Street Journal','WSJ','The New York Times','CNN','BBC','NBC News','CBS News','ABC News','Fox News','Financial Times','CNBC','The Washington Post'
];

export async function GET() {
  const { GNEWS_API_KEY } = process.env;
  if (!GNEWS_API_KEY) {
    return NextResponse.json({ error: 'Missing GNEWS_API_KEY env' }, { status: 500 });
  }
  try {
    const QUERIES = ['egg price','egg prices','egg price drop'];
    const fetchPromises = QUERIES.map(q =>
      fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=30&token=${GNEWS_API_KEY}`, {
        next: { revalidate: 3600 }
      })
    );
    const responses = await Promise.all(fetchPromises);
    const jsonArrays = await Promise.all(responses.map(r=> r.ok ? r.json().catch(()=>({articles:[]})) : {articles:[]}));

    // merge & dedupe by url
    const allArts = jsonArrays.flatMap(j=> j.articles || []);
    const seen = new Set();
    let articles = [];
    for (const a of allArts) {
      if (!a.url || seen.has(a.url)) continue;
      seen.add(a.url);
      articles.push({
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt,
        source: a.source?.name || 'Unknown'
      });
    }

    // filter out baking/recipe stories
    const BAKING_REGEX = /(bake|baking|recipe|cookies?|cake|cakes|bread|brownies?|muffins?|cupcakes?)/i;
    articles = articles.filter(a => !BAKING_REGEX.test(a.title));

    // newest first
    articles.sort((a,b)=> new Date(b.publishedAt) - new Date(a.publishedAt));

    // prioritise sources within the same timestamp order (stable sort approximation)
    articles.sort((a,b)=>{
      const ia = PRIORITY_SOURCES.findIndex(s=>a.source && a.source.toLowerCase().includes(s.toLowerCase()));
      const ib = PRIORITY_SOURCES.findIndex(s=>b.source && b.source.toLowerCase().includes(s.toLowerCase()));
      if (ia===-1 && ib===-1) return 0;
      if (ia===-1) return 1;
      if (ib===-1) return -1;
      return ia-ib;
    });

    // limit to 60 so payload small
    articles = articles.slice(0,60);

    return NextResponse.json({ articles });
  } catch (e) {
    return NextResponse.json({ error: 'GNews fetch failed' }, { status: 500 });
  }
} 