'use client';

import React, { useEffect, useState } from 'react';

// Helper function to parse relative date strings like "1 week ago", "2 days ago", etc.
function parseRelativeDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  // Try parsing as a regular date first
  const directDate = new Date(dateStr);
  if (!isNaN(directDate.getTime())) {
    return directDate;
  }
  
  // Handle relative date strings
  const now = new Date();
  const lowerStr = dateStr.toLowerCase().trim();
  
  // Extract number and unit from strings like "1 week ago", "2 days ago"
  const match = lowerStr.match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/);
  if (match) {
    const amount = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'minute':
        return new Date(now.getTime() - amount * 60 * 1000);
      case 'hour':
        return new Date(now.getTime() - amount * 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - amount * 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - amount * 7 * 24 * 60 * 60 * 1000);
      case 'month':
        const monthsAgo = new Date(now);
        monthsAgo.setMonth(monthsAgo.getMonth() - amount);
        return monthsAgo;
      case 'year':
        const yearsAgo = new Date(now);
        yearsAgo.setFullYear(yearsAgo.getFullYear() - amount);
        return yearsAgo;
    }
  }
  
  return null; // Return null for unparseable dates
}

export default function EggNewsPanel({ fontSize = '0.8rem' }) {
  const [articles, setArticles] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [source, setSource] = useState('News API');

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news', { cache: 'force-cache' });
        if (!res.ok) throw new Error('Bad resp');
        const data = await res.json();
        setArticles(data.articles || []);
        setLastUpdated(new Date());
        
        // Determine the source based on response or check for API keys
        // We can infer from the data structure or add a source field to the API response
        setSource(data.source || 'SERPHouse/GNews');
      } catch (e) {
        setArticles([]);
        setLastUpdated(new Date());
      }
    }
    fetchNews();
  }, []);

  if (articles === null) {
    return <div style={{ color: '#666' }}>Loading…</div>;
  }
  if (articles.length === 0) {
    return <div style={{ color: '#666' }}>No recent headlines.</div>;
  }

  // Sort articles by parsed date (most recent first)
  const sortedArticles = [...articles].sort((a, b) => {
    const dateA = parseRelativeDate(a.publishedAt);
    const dateB = parseRelativeDate(b.publishedAt);
    
    // If both dates are valid, sort by date (newest first)
    if (dateA && dateB) {
      return dateB.getTime() - dateA.getTime();
    }
    
    // If only one date is valid, put the valid one first
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;
    
    // If neither date is valid, maintain original order
    return 0;
  });

  // Format last updated time
  const formatLastUpdated = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize, lineHeight: 1.4 }}>
        {sortedArticles.slice(0,20).map((a) => {
          const parsedDate = parseRelativeDate(a.publishedAt);
          const dateDisplay = parsedDate 
            ? parsedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Recent';
          
          return (
            <li key={a.url} style={{ marginBottom: 6 }}>
              <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00c800', textDecoration: 'none' }}>
                {a.title.length > 120 ? a.title.slice(0, 117) + '…' : a.title}
              </a>
              <span style={{ color: '#999', marginLeft: 6, fontSize: '0.7em' }}>
                {a.source === 'Cable News Network' ? 'CNN' : a.source}
              </span>
              <span style={{ color: '#666', marginLeft: 4, fontSize: '0.7em' }}>
                {dateDisplay}
              </span>
            </li>
          );
        })}
      </ul>
      <div style={{ fontSize: '0.6em', color: '#666', marginTop: 4 }}>
        Source: {source}
        {lastUpdated && (
          <span style={{ marginLeft: 8 }}>
            • Last updated: {formatLastUpdated(lastUpdated)}
          </span>
        )}
      </div>
    </>
  );
} 