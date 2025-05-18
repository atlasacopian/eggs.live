import React, { useState, useEffect } from 'react';

export default function TerminalHeader({ view, zipCode, onSetView, isMobile }) {
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
    background: '#000000',
    color: '#ffffff',
    padding: isMobile ? '8px' : '8px 12px',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'Menlo, monospace',
    fontSize: isMobile ? '0.8rem' : '0.9rem',
    borderBottom: '1px solid #222222',
    height: isMobile ? 'auto' : '34px',
    boxSizing: 'border-box',
  };

  const infoGroupStyle = {
    flex: isMobile ? 'none' : '1 0 auto',
    textAlign: isMobile ? 'center' : 'left',
    marginBottom: isMobile ? '5px' : '0',
    width: isMobile ? '100%' : 'auto',
    minWidth: isMobile ? 'none' : '280px',
  };

  const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'center',
    flex: isMobile ? 'none' : '0 1 auto',
    marginBottom: isMobile ? '5px' : '0',
    width: isMobile ? '100%' : 'auto',
  };

  const viewButtonStyle = {
    background: '#111111',
    color: '#cccccc',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#333333',
    padding: '4px 8px',
    cursor: 'pointer',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    marginLeft: '4px',
    marginRight: '4px',
    minWidth: '90px',
    textAlign: 'center',
    boxSizing: 'border-box',
    opacity: 0.8,
  };

  const activeViewButtonStyle = {
    ...viewButtonStyle,
    background: '#000000',
    color: '#00ff00',
    borderColor: '#00ff00',
    opacity: 1,
  };

  const dateTimeStyle = {
    fontSize: isMobile ? '0.75rem' : '0.85rem',
    flex: isMobile ? 'none' : '1 0 auto',
    textAlign: isMobile ? 'center' : 'right',
    width: isMobile ? '100%' : 'auto',
  };

  return (
    <div style={headerStyle}>
      <div style={infoGroupStyle}>
        <span>Current View: {view}</span>
        {!isMobile && <span style={{ marginLeft: '20px' }}>ZIP Code: {zipCode || 'N/A'}</span>}
        {isMobile && <div style={{fontSize: '0.7rem'}}>ZIP Code: {zipCode || 'N/A'}</div>}
      </div>

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

      <div style={dateTimeStyle}>
        {formatDateTime(currentDateTime)}
      </div>
    </div>
  );
} 