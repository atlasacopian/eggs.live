import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600; // revalidate at most every hour

const PRIORITY_SOURCES = [
  'Reuters','Associated Press','AP','Bloomberg','The Wall Street Journal','WSJ','The New York Times','CNN','BBC','NBC News','CBS News','ABC News','Fox News','Financial Times','CNBC','The Washington Post'
];

export async function GET() {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: 'Missing Supabase env' }, { status: 500 });
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await sb
      .from('egg_news_articles')
      .select('title,url,published_at,source')
      .order('published_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    let articles = data || [];
    // prioritise major outlets
    articles = articles.sort((a,b)=>{
      const ia = PRIORITY_SOURCES.findIndex(s=>a.source && a.source.toLowerCase().includes(s.toLowerCase()));
      const ib = PRIORITY_SOURCES.findIndex(s=>b.source && b.source.toLowerCase().includes(s.toLowerCase()));
      if (ia===-1 && ib===-1) return 0;
      if (ia===-1) return 1;
      if (ib===-1) return -1;
      return ia-ib;
    });
    return NextResponse.json({ articles });
  } catch (e) {
    return NextResponse.json({ error: 'Supabase fetch failed' }, { status: 500 });
  }
} 