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
    justifyContent: 'space-between', // This will space out the three main groups
    alignItems: 'center',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.9rem',
    borderBottom: '1px solid #222222', // Darker border for black background
    height: '34px',
    boxSizing: 'border-box',
  };

  const infoGroupStyle = {
    // Takes up space on the left
    flex: '1 0 auto', // Allows it to shrink but not grow beyond content initially
    textAlign: 'left',
  };

  const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'center', // Center buttons within their own group if needed
    flex: '0 1 auto', // Allows shrinking, minimal auto growth, for centering
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
    marginLeft: '4px', // Space between buttons
    marginRight: '4px',
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
    flex: '1 0 auto', // Allows it to shrink but not grow beyond content initially
    textAlign: 'right',
  };

  return (
    <div style={headerStyle}>
      {/* Left Group: View/ZIP */}
      <div style={infoGroupStyle}>
        <span>Current View: {view}</span>
        <span style={{ marginLeft: '20px' }}>ZIP Code: {zipCode || 'N/A'}</span>
      </div>

      {/* Center Group: Buttons */}
      <div style={buttonGroupStyle}>
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

      {/* Right Group: Date/Time */}
      <div style={dateTimeStyle}>
        {formatDateTime(currentDateTime)}
      </div>
    </div>
  );
} 