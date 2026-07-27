'use client';

import React, { useEffect, useState } from 'react';
import { BLUE, RED, YELLOW, citationStyle } from '../lib/terminalTheme';

// Unifies two previously-separate panels (News, Bird Flu) into one
// reverse-chronological "what's driving the market today" feed. This is the
// direct answer to "what's happening in the American food system right now"
// - a scattered grid of unrelated widgets doesn't answer that, a single
// timeline does.
function formatRelativeDate(d) {
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatBirds(n) {
  if (n == null) return '--';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function SignalsFeed({ fontSize = '0.8rem' }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [hpaiTotals, setHpaiTotals] = useState(null);
  const [hpaiAllTime, setHpaiAllTime] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/news').then(r => r.json()).catch(() => ({ articles: [] })),
      fetch('/api/hpai-detections').then(r => r.json()).catch(() => ({ recent: [], last30Days: {}, totals: {} })),
    ]).then(([news, hpai]) => {
      if (cancelled) return;
      const newsItems = (news.articles || []).map(a => ({
        type: 'news',
        date: new Date(a.publishedAt),
        title: a.title,
        meta: a.source,
        url: a.url,
      }));
      const outbreakItems = (hpai.recent || []).map(r => ({
        type: 'outbreak',
        date: new Date(r.confirmed_date),
        title: `${r.flock_type === 'commercial' ? 'Commercial' : 'Backyard'} flock outbreak · ${r.county}, ${r.state}`,
        meta: `${r.birds_affected.toLocaleString()} birds affected`,
      }));
      const merged = [...newsItems, ...outbreakItems]
        .filter(i => !isNaN(i.date.getTime()))
        .sort((a, b) => b.date - a.date)
        .slice(0, 40);
      setItems(merged);
      setHpaiTotals(hpai.last30Days || null);
      setHpaiAllTime(hpai.totals || null);
    }).catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  if (error) return <div style={{ padding: 8, color: '#666', fontSize: '0.8rem' }}>Failed to load market signals.</div>;
  if (!items) return <div style={{ padding: 8, color: '#666', fontSize: '0.8rem' }}>Loading market signals…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Menlo, monospace' }}>
      {hpaiTotals && (
        <div style={{ display: 'flex', gap: 16, padding: '2px 4px 8px', borderBottom: '1px solid #1a1a1a', marginBottom: 4, flexWrap: 'wrap' }}>
          <div>
            <span style={{ color: YELLOW, fontWeight: 700, fontSize: '1rem' }}>{hpaiTotals.newDetections}</span>
            <span style={{ color: '#888', fontSize: '0.6rem', marginLeft: 4, letterSpacing: '0.04em' }}>NEW (30D)</span>
          </div>
          {hpaiAllTime && (
            <>
              <div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{hpaiAllTime.commercialFlocks?.toLocaleString()}</span>
                <span style={{ color: '#888', fontSize: '0.6rem', marginLeft: 4, letterSpacing: '0.04em' }}>COMMERCIAL FLOCKS</span>
              </div>
              <div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{hpaiAllTime.backyardFlocks?.toLocaleString()}</span>
                <span style={{ color: '#888', fontSize: '0.6rem', marginLeft: 4, letterSpacing: '0.04em' }}>BACKYARD FLOCKS</span>
              </div>
              <div>
                <span style={{ color: RED, fontWeight: 700, fontSize: '1rem' }}>{formatBirds(hpaiAllTime.totalBirdsAffected)}</span>
                <span style={{ color: '#888', fontSize: '0.6rem', marginLeft: 4, letterSpacing: '0.04em' }}>BIRDS AFFECTED (TOTAL)</span>
              </div>
            </>
          )}
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {items.map((item, i) => (
          <a
            key={i}
            href={item.url || undefined}
            target={item.url ? '_blank' : undefined}
            rel={item.url ? 'noreferrer' : undefined}
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'baseline',
              padding: '4px 4px',
              borderBottom: '1px solid #141414',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <span style={{
              fontSize: '0.56rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              color: item.type === 'outbreak' ? RED : BLUE,
              width: 56,
              flexShrink: 0,
            }}>
              {item.type === 'outbreak' ? 'OUTBREAK' : 'NEWS'}
            </span>
            <span
              style={{
                fontSize,
                color: '#ddd',
                flex: 1,
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={item.title}
            >
              {item.title}
              {item.meta && <span style={{ color: '#777' }}> · {item.meta}</span>}
            </span>
            <span style={{ ...citationStyle, flexShrink: 0, whiteSpace: 'nowrap' }}>
              {formatRelativeDate(item.date)}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
