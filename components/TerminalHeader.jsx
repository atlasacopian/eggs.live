import React, { useState, useEffect } from 'react';

export default function TerminalHeader({ view, zipCode, onSetView }) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer); // Cleanup the interval on component unmount
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const headerStyle = {
    background: '#000000', // Changed to black
    color: '#ffffff',     // Changed to white
    padding: '8px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.9rem',
    borderBottom: '1px solid #222222', // Darker border for black background
    height: '34px',
    boxSizing: 'border-box',
  };

  const buttonGroupStyle = {
    display: 'flex',
    alignItems: 'center', // Align buttons with date/time text
  };

  const viewButtonStyle = {
    background: '#1a1a1a', // Dark gray background for buttons
    color: '#ffffff',     // White text for non-active
    border: '1px solid #333333', 
    padding: '4px 8px',
    cursor: 'pointer',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    marginLeft: '8px',
  };

  const activeViewButtonStyle = {
    ...viewButtonStyle,
    color: '#00ff00', // Green text for active
    border: '1px solid #00ff00',
    background: '#2a2a2a', // Slightly lighter dark gray for active button background
    fontWeight: 'bold',
  };

  const dateTimeStyle = {
    fontSize: '0.85rem',
    marginRight: '15px', // Space before the buttons
  };

  return (
    <div style={headerStyle}>
      <div>
        <span>Current View: {view}</span>
        <span style={{ marginLeft: '20px' }}>ZIP Code: {zipCode || 'N/A'}</span>
      </div>
      <div style={buttonGroupStyle}>
        <span style={dateTimeStyle}>{formatDateTime(currentDateTime)}</span>
        <button 
          onClick={() => onSetView('local')} 
          style={view === 'local' ? activeViewButtonStyle : viewButtonStyle}
        >
          Local
        </button>
        <button 
          onClick={() => onSetView('national')} 
          style={view === 'national' ? activeViewButtonStyle : viewButtonStyle}
        >
          National
        </button>
      </div>
    </div>
  );
} 