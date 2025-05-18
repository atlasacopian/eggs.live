import React from 'react';

export default function TerminalTile({ title, span, children, style, bodyStyle }) {
  const tileStyle = {
    gridColumn: span ? `span ${span}` : 'auto',
    background: '#0d0d0d', // Very dark gray, almost black
    border: '1px solid #333',     // Dark gray border
    color: '#e0e0e0',          // Light gray text
    fontFamily: 'Menlo, monospace',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // Prevent content from breaking layout
    ...style, // Allow overriding with passed styles
  };

  const headerStyle = {
    background: '#1a1a1a', // Slightly lighter gray for header
    padding: '6px 8px',
    fontSize: '0.85rem',
    color: '#00ff00',     // Green title text
    borderBottom: '1px solid #333',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const defaultBodyStyle = {
    padding: '8px',
    flexGrow: 1,
    overflow: 'auto', // Allow scrolling for content if it overflows
    ...bodyStyle, // Allow overriding with passed styles
  };

  return (
    <div style={tileStyle}>
      {title && <div style={headerStyle}>{title}</div>}
      <div style={defaultBodyStyle}>
        {children}
      </div>
    </div>
  );
} 