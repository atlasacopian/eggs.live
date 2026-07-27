import React from 'react';
import { GREEN, PANEL_BORDER } from '../lib/terminalTheme';

// Black panel, black header, color comes from the text/data itself - but
// every real Bloomberg screen is a literal bordered grid: each cell boxed on
// all four sides, panels touching edge-to-edge with a hairline between them,
// not floating cards with soft gaps. The full border is what makes this read
// as a terminal grid instead of a loose stack of widgets.
export default function TerminalTile({ title, span, children, style, bodyStyle, live = false }) {
  const wrapperStyle = {
    gridColumn: span ? `span ${span}` : 'auto',
    background: '#000',
    color: '#ffffff',
    fontFamily: 'Menlo, monospace',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: `1px solid ${PANEL_BORDER}`,
    boxSizing: 'border-box',
    ...style,
  };

  const headerStyle = {
    background: '#000',
    color: '#fff',
    textTransform: 'uppercase',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    padding: '2px 5px 3px',
    borderBottom: `1px solid ${PANEL_BORDER}`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    flexShrink: 0,
  };

  const defaultBodyStyle = {
    flexGrow: 1,
    overflow: 'auto',
    background: '#000',
    color: '#ffffff',
    padding: '4px 5px',
    ...bodyStyle,
  };

  return (
    <div style={wrapperStyle}>
      {title && (
        <div style={headerStyle}>
          {live && (
            <span
              style={{
                display: 'inline-block',
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: GREEN,
                flexShrink: 0,
              }}
            />
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        </div>
      )}
      <div style={defaultBodyStyle}>
        {children}
      </div>
    </div>
  );
}
