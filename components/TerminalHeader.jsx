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
    // Format date as MM-DD-YYYY
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    // Get local time string with time zone abbreviation
    const timeString = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const tzAbbr = date.toLocaleTimeString(undefined, { timeZoneName: 'short' }).split(' ').pop();
    return `${mm}-${dd}-${yyyy} ${timeString} ${tzAbbr}`;
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

  const eggsLiveStyle = {
    fontSize: isMobile ? '0.8rem' : '1rem',
    fontWeight: 'bold',
    color: '#fff',
    marginRight: '12px',
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
    color: '#fff',
    borderColor: '#fff',
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

  return (
    <div style={headerStyle}>
      <div style={infoGroupStyle}>
        <span style={eggsLiveStyle}>EGGS.LIVE</span>
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
        <span>{formatDateTime(currentDateTime)}</span>
        <span style={{ marginLeft: 16, fontWeight: 600 }}>ZIP CODE: {zipCode || 'N/A'}</span>
      </div>
    </div>
  );
} 