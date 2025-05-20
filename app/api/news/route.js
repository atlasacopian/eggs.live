import { NextResponse } from 'next/server';

export const revalidate = 3600; // revalidate at most every hour

export async function GET() {
  const { GNEWS_API_KEY } = process.env;
  if (!GNEWS_API_KEY) {
    return NextResponse.json({ error: 'Missing GNEWS_API_KEY' }, { status: 500 });
  }
  const endpoint = `https://gnews.io/api/v4/search?q=egg%20price&lang=en&country=us&max=10&apikey=${GNEWS_API_KEY}`;

  const PRIORITY_SOURCES = [
    'Reuters', 'Associated Press', 'AP', 'Bloomberg', 'The Wall Street Journal', 'WSJ', 'The New York Times', 'CNN', 'BBC', 'NBC News', 'CBS News', 'ABC News', 'Fox News', 'Financial Times', 'CNBC', 'The Washington Post'
  ];

  try {
    const resp = await fetch(endpoint);
    if (!resp.ok) {
      return NextResponse.json({ error: 'Upstream error', status: resp.status }, { status: 502 });
    }
    const data = await resp.json();
    // Return only needed fields
    let articles = (data.articles || []).map(({ title, url, publishedAt, source }) => ({ title, url, publishedAt, source: source?.name }));
    // Sort by priority list first, then fallback to original order
    articles = articles.sort((a, b) => {
      const idxA = PRIORITY_SOURCES.findIndex(s => a.source && a.source.toLowerCase().includes(s.toLowerCase()));
      const idxB = PRIORITY_SOURCES.findIndex(s => b.source && b.source.toLowerCase().includes(s.toLowerCase()));
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
    return NextResponse.json({ articles });
  } catch (e) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
} 