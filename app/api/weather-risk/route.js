import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { SEVERITY_RANK, CATEGORY_LABELS, computeMarketRisk } from '../../../lib/weatherRiskConstants';

export async function GET() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ ready: false, error: 'Missing Supabase configuration' }, { status: 500 });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // expires_at filter is defense-in-depth (the collector already prunes
    // anything no longer in NWS's active feed every hour) - keeps the API
    // honest even if a run is delayed or fails.
    const { data, error } = await sb
      .from('weather_risk_alerts')
      .select('id, state, event_type, category, severity, headline, source_url, effective_at, expires_at, is_major_producer, fetched_at')
      .gt('expires_at', new Date().toISOString());

    if (error) throw error;

    const rows = data || [];

    // Ranked: major-producer states first, then by NWS's own severity,
    // then soonest-effective first within the same tier.
    const alerts = rows
      .slice()
      .sort((a, b) => {
        if (a.is_major_producer !== b.is_major_producer) return a.is_major_producer ? -1 : 1;
        const sevDiff = (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0);
        if (sevDiff !== 0) return sevDiff;
        return new Date(a.effective_at || 0) - new Date(b.effective_at || 0);
      })
      .map(r => ({
        id: r.id,
        state: r.state,
        eventType: r.event_type,
        category: r.category,
        categoryLabel: CATEGORY_LABELS[r.category] || r.category,
        severity: r.severity,
        headline: r.headline,
        sourceUrl: r.source_url,
        effectiveAt: r.effective_at,
        expiresAt: r.expires_at,
        isMajorProducer: r.is_major_producer,
      }));

    const lastUpdated = rows.reduce((latest, r) => {
      const t = r.fetched_at ? new Date(r.fetched_at).getTime() : 0;
      return t > latest ? t : latest;
    }, 0);

    return NextResponse.json({
      ready: true,
      count: alerts.length,
      majorProducerCount: alerts.filter(a => a.isMajorProducer).length,
      alerts,
      marketRisk: computeMarketRisk(alerts),
      lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
    });
  } catch (err) {
    console.error('weather-risk error:', err);
    return NextResponse.json({ ready: false, error: err.message || 'Failed to fetch weather risk data' }, { status: 500 });
  }
}
