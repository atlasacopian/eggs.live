'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TerminalHeader({ view, zipCode, onSetView, isMobile }) {
  const router = useRouter();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [editingZip, setEditingZip] = useState(false);
  const [tempZip, setTempZip] = useState(zipCode || '');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer); // Cleanup the interval on component unmount
  }, []);

  useEffect(()=>{setTempZip(zipCode||'')},[zipCode]);

  const formatDateTime = (date) => {
    // Format date as MM/DD/YYYY
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    // Local time with seconds, no time zone abbreviation
    const timeString = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${mm}/${dd}/${yyyy} ${timeString}`;
  };

  const headerStyle = {
    background: '#000000',
    color: '#ffffff',
    padding: isMobile ? '4px 8px' : '4px 12px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Menlo, monospace',
    fontSize: isMobile ? '0.8rem' : '0.9rem',
    borderBottom: '1px solid #222222',
    boxSizing: 'border-box',
  };

  const topRowStyle = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
  };

  const infoGroupStyle = isMobile ? {
    width: '100%',
    textAlign: 'center',
    marginBottom: '5px',
  } : {
    textAlign: 'left',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const eggsLiveStyle = {
    fontSize: isMobile ? '0.8rem' : '1rem',
    fontWeight: 'bold',
    color: '#fff',
    marginRight: '12px',
    textDecoration:'none'
  };

  const buttonGroupStyle = isMobile ? {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '5px',
    width: '100%',
  } : {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    // Absolutely centered on the row so it stays dead-center regardless of
    // how wide the EGGS.LIVE / date-time content on either side is.
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  };

  const viewButtonStyle = {
    background: 'transparent',
    color: '#888888',
    border: 'none',
    padding: '4px 8px',
    cursor: 'pointer',
    fontFamily: 'Menlo, monospace',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    // Fixed width sized for the longest bracketed label ("[ NATIONAL ]") so
    // switching which view is active doesn't shift the other button.
    width: '110px',
    textAlign: 'center',
    boxSizing: 'border-box',
  };

  const activeViewButtonStyle = {
    ...viewButtonStyle,
    color: '#fff',
  };

  const dateTimeStyle = isMobile ? {
    fontSize: '0.75rem',
    textAlign: 'center',
    width: '100%',
  } : {
    fontSize: '0.85rem',
    textAlign: 'right',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const zipInputStyle = {
    ...activeViewButtonStyle,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    padding: '4px 8px',
    // iOS Safari auto-zooms on focus for any input under 16px; render at 16px
    // and scale back down visually to match the button's 0.8rem look.
    fontSize: isMobile ? 16 : '0.8rem',
    transform: isMobile ? 'scale(0.8)' : undefined,
    transformOrigin: 'center',
  };

  const handleZipSubmit = () => {
    setEditingZip(false);
    if (tempZip.match(/^\d{5}$/) && tempZip !== zipCode) {
      router.push(`/${tempZip}`);
    } else {
      setTempZip(zipCode || '');
    }
  };

  const handleLocalClick = () => {
    if (view === 'local') {
      setEditingZip(true);
    } else {
      onSetView('local');
    }
  };

  return (
    <div style={headerStyle}>
      <div style={topRowStyle}>
        <div style={infoGroupStyle}>
          <a href="/" style={eggsLiveStyle}>EGGS.LIVE</a>
        </div>

        <div style={buttonGroupStyle}>
          {editingZip ? (
            <input
              value={tempZip}
              onChange={e => setTempZip(e.target.value)}
              onBlur={handleZipSubmit}
              onKeyDown={e => { if (e.key === 'Enter') handleZipSubmit(); }}
              style={zipInputStyle}
              type="text"
              inputMode="numeric"
              maxLength={5}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              autoFocus
            />
          ) : (
            <button
              onClick={handleLocalClick}
              style={view === 'local' ? activeViewButtonStyle : viewButtonStyle}
            >
              {view === 'local' ? `[ ${zipCode || 'N/A'} ]` : (zipCode || 'N/A')}
            </button>
          )}
          <button
            onClick={() => onSetView('national')}
            style={view === 'national' ? activeViewButtonStyle : viewButtonStyle}
          >
            {view === 'national' ? '[ NATIONAL ]' : 'NATIONAL'}
          </button>
        </div>

        <div style={dateTimeStyle}>
          <span>{formatDateTime(currentDateTime)}</span>
        </div>
      </div>
    </div>
  );
}