import React from 'react';
import { SANS, SURFACE_HI, TEXT, TEXT_3, HAIRLINE } from '../lib/terminalTheme';

// iOS-style segmented control. `options` is [{ value, label }].
export default function Segmented({ options, value, onChange, size = 'md', ariaLabel }) {
  const pad = size === 'sm' ? '3px 9px' : '5px 12px';
  const font = size === 'sm' ? 11 : 12;
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{ display: 'inline-flex', padding: 2, gap: 2, background: '#000', border: `1px solid ${HAIRLINE}`, borderRadius: 9, fontFamily: SANS }}
    >
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            style={{
              border: 'none',
              borderRadius: 7,
              padding: pad,
              fontSize: font,
              fontWeight: active ? 600 : 500,
              fontFamily: SANS,
              color: active ? TEXT : TEXT_3,
              background: active ? SURFACE_HI : 'transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
