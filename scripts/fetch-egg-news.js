// scripts/fetch-egg-news.js
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, GNEWS_API_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GNEWS_API_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const endpoint = `https://gnews.io/api/v4/search?q=egg%20price&lang=en&country=us&max=20&apikey=${GNEWS_API_KEY}`;

const PRIORITY_SOURCES = [
  'Reuters','Associated Press','AP','Bloomberg','The Wall Street Journal','WSJ','The New York Times','CNN','BBC','NBC News','CBS News','ABC News','Fox News','Financial Times','CNBC','The Washington Post'
];

(async () => {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`GNews ${res.status}`);
    const data = await res.json();
    let articles = (data.articles || []).map(({ title, url, publishedAt, source }) => ({
      id: crypto.createHash('sha256').update(url).digest('hex').slice(0, 32),
      title,
      url,
      published_at: publishedAt,
      source: source?.name || null
    }));
    // Prioritize major outlets first
    articles = articles.sort((a,b)=>{
      const ia = PRIORITY_SOURCES.findIndex(s=>a.source && a.source.toLowerCase().includes(s.toLowerCase()));
      const ib = PRIORITY_SOURCES.findIndex(s=>b.source && b.source.toLowerCase().includes(s.toLowerCase()));
      if (ia===-1 && ib===-1) return 0;
      if (ia===-1) return 1;
      if (ib===-1) return -1;
      return ia-ib;
    });

    // Upsert into Supabase (table must exist)
    const { error } = await sb.from('egg_news_articles').upsert(articles, { onConflict: 'id' });
    if (error) throw error;

    console.log(`✅ Upserted ${articles.length} news articles`);
  } catch (e) {
    console.error('Egg news fetch error', e);
    process.exit(1);
  }
})(); 