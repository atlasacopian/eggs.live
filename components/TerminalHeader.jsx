'use client'
import React, { useState, useEffect } from 'react';
import { PANEL_BORDER, SERIF, YELLOW, ORANGE } from '../lib/terminalTheme';

export default function TerminalHeader({ view, zipCode, onSetView, isMobile }) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [hoveredTab, setHoveredTab] = useState(null); // 'local' | 'national' | null

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer); // Cleanup the interval on component unmount
  }, []);

  const formatDateTime = (date) => {
    // Format date as MM/DD/YYYY
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    // Local time with seconds, 24-hour format, no time zone abbreviation
    const timeString = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    return `${mm}/${dd}/${yyyy} ${timeString}`;
  };

  const headerStyle = {
    background: '#000000',
    color: '#ffffff',
    padding: isMobile ? '6px 6px 5px' : '8px 10px 6px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Menlo, monospace',
    fontSize: isMobile ? '0.78rem' : '0.85rem',
    borderBottom: `1px solid ${PANEL_BORDER}`,
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
  };

  // Serif nameplate, like a printed bulletin's masthead - the one deliberate
  // typographic break from the mono "data" register used everywhere else.
  const eggsLiveStyle = {
    fontFamily: SERIF,
    fontSize: isMobile ? '1.05rem' : '1.3rem',
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '0.01em',
  };

  // Flat underline tabs, not solid-fill pill buttons - a big colorful block
  // read as an app button, not a serious terminal. Text + a thin colored
  // underline when active is the same information with far less "toy" feel.
  const navBarStyle = isMobile ? {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
    flexShrink: 0,
  } : {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
  };

  const tabStyle = (active, hovered) => ({
    background: 'transparent',
    color: active ? YELLOW : hovered ? 'rgba(255, 226, 52, 0.5)' : '#555',
    padding: isMobile ? '3px 9px' : '3px 11px',
    fontSize: isMobile ? '0.62rem' : '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
    cursor: 'pointer',
    border: 'none',
    boxSizing: 'border-box',
    fontFamily: 'Menlo, monospace',
    whiteSpace: 'nowrap',
  });

  const dateTimeStyle = isMobile ? {
    fontSize: '0.75rem',
    textAlign: 'center',
    width: '100%',
  } : {
    fontSize: '0.8rem',
    color: '#999',
    textAlign: 'right',
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={headerStyle}>
      <div style={topRowStyle}>
        <div style={infoGroupStyle}>
          <span style={eggsLiveStyle}>EGGS.LIVE</span>
        </div>

        <div style={navBarStyle}>
          <button
            onClick={() => onSetView('local')}
            onMouseEnter={() => setHoveredTab('local')}
            onMouseLeave={() => setHoveredTab(null)}
            style={tabStyle(view === 'local', hoveredTab === 'local')}
          >
            ZIP
          </button>
          <button
            onClick={() => onSetView('national')}
            onMouseEnter={() => setHoveredTab('national')}
            onMouseLeave={() => setHoveredTab(null)}
            style={tabStyle(view === 'national', hoveredTab === 'national')}
          >
            MARKET
          </button>
        </div>

        <div style={dateTimeStyle}>
          <span>{formatDateTime(currentDateTime)}</span>
        </div>
      </div>
    </div>
  );
}
