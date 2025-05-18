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
    justifyContent: isMobile ? 'space-between' : 'center',
    alignItems: 'center',
    fontFamily: 'Menlo, monospace',
    fontSize: isMobile ? '0.8rem' : '0.9rem',
    borderBottom: '1px solid #222222',
    height: isMobile ? 'auto' : '34px',
    boxSizing: 'border-box',
    position: 'relative',
  };

  const infoGroupStyle = isMobile ? {
    width: '100%',
    textAlign: 'center',
    marginBottom: '5px',
  } : {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '300px',
    textAlign: 'left',
  };

  const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: isMobile ? 'none' : '0 0 200px',
    marginBottom: isMobile ? '5px' : '0',
    width: isMobile ? '100%' : '200px',
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

  const dateTimeStyle = isMobile ? {
    fontSize: '0.75rem',
    textAlign: 'center',
    width: '100%',
  } : {
    fontSize: '0.85rem',
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    textAlign: 'right',
    minWidth: '180px',
  };

  const currentViewTextStyle = {
    display: isMobile ? 'block' : 'inline-block', // Block on mobile for stacking, inline-block on desktop for width
    width: isMobile ? 'auto' : '160px', // Fixed width on desktop
    textAlign: isMobile ? 'center' : 'left', // Center on mobile if stacked
  };

  return (
    <div style={headerStyle}>
      <div style={infoGroupStyle}>
        <span style={currentViewTextStyle}>Current View: {view}</span>
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