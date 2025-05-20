'use client';

import React, { useEffect, useState } from 'react';

export default function EggNewsPanel({ fontSize = '0.8rem' }) {
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('Bad resp');
        const { articles } = await res.json();
        setArticles(articles || []);
      } catch (e) {
        setArticles([]);
      }
    }
    fetchNews();
    const id = setInterval(fetchNews, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (articles === null) {
    return <div style={{ color: '#666' }}>Loading…</div>;
  }
  if (articles.length === 0) {
    return <div style={{ color: '#666' }}>No recent headlines.</div>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize, lineHeight: 1.4 }}>
      {articles.map((a) => (
        <li key={a.url} style={{ marginBottom: 6 }}>
          <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00c800', textDecoration: 'none' }}>
            {a.title.length > 120 ? a.title.slice(0, 117) + '…' : a.title}
          </a>
          <span style={{ color: '#666', marginLeft: 4, fontSize: '0.7em' }}>
            {new Date(a.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </li>
      ))}
    </ul>
  );
} 