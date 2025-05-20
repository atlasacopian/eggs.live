import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  const { data, error } = await sb
    .from('egg_stock_quotes')
    .select('symbol, price, change_pct, updated_at');

  if (error) {
    console.error('Supabase select error', error);
    return res.status(500).json({ error: 'supabase select error' });
  }

  res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=30');
  return res.status(200).json({ data });
} 