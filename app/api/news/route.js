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
    const url = `https://gnews.io/api/v4/search?q=egg%20price&lang=en&max=30&token=${GNEWS_API_KEY}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      const body = await res.text().catch(()=>'<no body>');
      return NextResponse.json({ error: `GNews ${res.status}: ${body.slice(0,200)}` }, { status: 500 });
    }
    const json = await res.json();
    let articles = (json.articles || []).map(a => ({
      title: a.title,
      url: a.url,
      publishedAt: a.publishedAt,
      source: a.source?.name || 'Unknown'
    }));
    // simple unwanted baking filter
    const BAKING_REGEX = /(bake|baking|recipe|cookies?|cake|cakes|bread|brownies?|muffins?|cupcakes?)/i;
    articles = articles.filter(a => !BAKING_REGEX.test(a.title));
    // prioritise sources
    articles = articles.sort((a,b)=>{
      const ia = PRIORITY_SOURCES.findIndex(s=>a.source && a.source.toLowerCase().includes(s.toLowerCase()));
      const ib = PRIORITY_SOURCES.findIndex(s=>b.source && b.source.toLowerCase().includes(s.toLowerCase()));
      if (ia===-1 && ib===-1) return 0;
      if (ia===-1) return 1;
      if (ib===-1) return -1;
      return ia-ib;
    }).slice(0,20);

    return NextResponse.json({ articles });
  } catch (e) {
    return NextResponse.json({ error: 'GNews fetch failed' }, { status: 500 });
  }
} 