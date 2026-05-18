'use client';

import React, { useEffect, useState } from 'react';
import styles from './TickerStrip.module.css'; // reuse existing styles

export default function NewsStrip({ fontSize = '12px' }) {
  const [content, setContent] = useState('Loading latest egg-price headlines…');

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news', { cache: 'force-cache' });
        if (!res.ok) return;
        const { articles } = await res.json();
        if (articles && articles.length) {
          const headlineString = articles
            .map(a => `<a href="${a.url}" target="_blank" rel="noopener noreferrer">${a.title}</a> <span style='margin:0 4px;'>🥚</span>`)
            .join(' ');
          setContent(headlineString);
        }
      } catch (e) {
        // ignore
      }
    }
    fetchNews();
  }, []);

  return (
    <div className={styles.tickerContainer}>
      <div className={styles.tickerWrap}>
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            className={styles.tickerItem}
            style={{ fontSize }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ))}
      </div>
    </div>
  );
} 