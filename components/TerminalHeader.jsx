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
    // Local time, no seconds and no time zone abbreviation
    const timeString = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return `${mm}/${dd}/${yyyy} ${timeString}`;
  };

  const headerStyle = {
    background: '#000000',
    color: '#ffffff',
    padding: isMobile ? '8px' : '8px 12px',
    display: isMobile ? 'flex' : 'grid',
    gridTemplateColumns: isMobile ? undefined : 'minmax(100px, 1fr) auto minmax(390px, 1.6fr)',
    flexDirection: isMobile ? 'column' : undefined,
    justifyContent: isMobile ? 'space-between' : undefined,
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

  const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    flex: isMobile ? 'none' : '0 0 240px',
    marginBottom: isMobile ? '5px' : '0',
    width: isMobile ? '100%' : '240px',
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

  return (
    <div style={headerStyle}>
      <div style={infoGroupStyle}>
        <a href="/" style={eggsLiveStyle}>EGGS.LIVE</a>
      </div>

      <div style={buttonGroupStyle}>
        <button
          onClick={() => onSetView('local')}
          style={view === 'local' ? activeViewButtonStyle : viewButtonStyle}
        >
          {view === 'local' ? '[ LOCAL ]' : 'LOCAL'}
        </button>
        <button
          onClick={() => onSetView('national')}
          style={view === 'national' ? activeViewButtonStyle : viewButtonStyle}
        >
          {view === 'national' ? '[ NATIONAL ]' : 'NATIONAL'}
        </button>
      </div>

      <div style={dateTimeStyle}>
        <span>{formatDateTime(currentDateTime)}</span>
        {view === 'local' && (
          <span style={{ marginLeft: 16, fontWeight: 600 }}>
            ZIP CODE:{' '}
            {editingZip ? (
              <input
                value={tempZip}
                onChange={e=>setTempZip(e.target.value)}
                onBlur={()=>setEditingZip(false)}
                onKeyDown={e=>{if(e.key==='Enter'){setEditingZip(false); if(tempZip.match(/^\d{5}$/)){router.push(`/${tempZip}`)}}}}
                style={{width:70,boxSizing:'border-box',background:'#000',color:'#fff',border:'1px solid transparent',outline:'none',boxShadow:'none',fontFamily:'Menlo, monospace',fontSize:16,fontWeight:600,textAlign:'left',transform:`scale(${isMobile ? 0.75 : 0.85})`,transformOrigin:'left center'}}
                type="text"
                inputMode="numeric"
                maxLength={5}
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                autoFocus
              />
            ) : (
              <span
                style={{display:'inline-block',width:70,boxSizing:'border-box',border:'1px solid transparent',textAlign:'left',cursor:'pointer'}}
                onClick={()=>setEditingZip(true)}
              >
                {zipCode || 'N/A'}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
} 