import { NextResponse } from 'next/server';

export const revalidate = 600; // revalidate at most every 10 minutes

export async function GET() {
  const { GNEWS_API_KEY } = process.env;
  if (!GNEWS_API_KEY) {
    return NextResponse.json({ error: 'Missing GNEWS_API_KEY' }, { status: 500 });
  }
  const endpoint = `https://gnews.io/api/v4/search?q=egg%20price&lang=en&country=us&max=10&apikey=${GNEWS_API_KEY}`;

  try {
    const resp = await fetch(endpoint);
    if (!resp.ok) {
      return NextResponse.json({ error: 'Upstream error', status: resp.status }, { status: 502 });
    }
    const data = await resp.json();
    // Return only needed fields
    const articles = (data.articles || []).map(({ title, url, publishedAt, source }) => ({ title, url, publishedAt, source: source?.name }));
    return NextResponse.json({ articles });
  } catch (e) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
} 