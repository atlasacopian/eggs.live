import React from 'react';

export default function TerminalTile({ title, span, children, style, bodyStyle }) {
  const tileStyle = {
    gridColumn: span ? `span ${span}` : 'auto',
    background: '#000000', // Changed to black
    border: '1px solid #222222',     // Darker border for black background
    color: '#ffffff',          // Changed to white
    fontFamily: 'Menlo, monospace',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // Prevent content from breaking layout
    ...style, // Allow overriding with passed styles
  };

  const headerStyle = {
    background: '#000000', // Changed to black
    padding: '6px 8px',
    fontSize: '0.85rem',
    color: '#ffffff',     // Changed to white
    borderBottom: '1px solid #222222', // Darker border for black background
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
    background: '#000000', // Ensure body background is also black
    color: '#ffffff',     // Ensure body text is also white
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