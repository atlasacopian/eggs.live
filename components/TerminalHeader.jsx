import React from 'react';

export default function TerminalHeader({ view, zipCode, onToggle }) {
  const headerStyle = {
    background: '#1a1a1a', // Darker gray
    color: '#e0e0e0',     // Light gray text
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.9rem',
    borderBottom: '1px solid #333', // Subtle border
    height: '34px', // Match height calculation in BloombergTerminal
    boxSizing: 'border-box',
  };

  const infoStyle = {
    color: '#00ff00', // Green accent for info
  };

  const buttonStyle = {
    background: '#333',
    color: '#00ff00', // Green text
    border: '1px solid #00ff00', // Green border
    padding: '4px 8px',
    cursor: 'pointer',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
  };

  return (
    <div style={headerStyle}>
      <div>
        <span>Current View: <span style={infoStyle}>{view}</span></span>
        <span style={{ marginLeft: '20px' }}>ZIP Code: <span style={infoStyle}>{zipCode || 'N/A'}</span></span>
      </div>
      <button onClick={onToggle} style={buttonStyle}>
        Toggle View
      </button>
    </div>
  );
} 