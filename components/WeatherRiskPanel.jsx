import React from 'react';
import { RED, ORANGE, YELLOW, GREEN } from '../lib/terminalTheme';

const LEVEL_COLOR = {
  HIGH: RED,
  MODERATE: ORANGE,
  LOW: YELLOW,
  NONE: GREEN,
};

function timeAgo(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return `${hours} hr${hours === 1 ? '' : 's'} ago`;
}

// Answers "is weather currently creating meaningful risk for the U.S. egg
// market?" via computeMarketRisk's HIGH/MODERATE/LOW/NONE classification
// (see lib/weatherRiskConstants.js for the full methodology) - not a raw
// alert count/list.
export default function WeatherRiskPanel({ data }) {
  if (!data || !data.ready) {
    return <div style={{ padding: 16, color: '#666', fontSize: '0.8rem' }}>Loading weather risk…</div>;
  }

  const risk = data.marketRisk;
  if (!risk) return null;

  const color = LEVEL_COLOR[risk.level] || '#888';

  let body;
  if (risk.level === 'NONE') {
    body = <div style={{ fontSize: '0.68rem', color: '#888', marginTop: 8 }}>No active alerts in major egg-producing states.</div>;
  } else if (risk.level === 'HIGH') {
    body = (
      <>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', marginTop: 8 }}>{risk.dominantCategoryLabel}</div>
        <div style={{ fontSize: '0.66rem', color: '#aaa', marginTop: 2 }}>
          {risk.dominantCategoryStates} major egg-producing states
        </div>
      </>
    );
  } else if (risk.level === 'MODERATE') {
    body = (
      <>
        <div style={{ fontSize: '0.7rem', color: '#ccc', marginTop: 8 }}>
          {risk.significantEventCount} significant weather event{risk.significantEventCount === 1 ? '' : 's'}
        </div>
        <div style={{ marginTop: 4 }}>
          {risk.significantEvents.map(e => (
            <div key={`${e.category}::${e.state}`} style={{ fontSize: '0.64rem', color: '#ccc', padding: '1px 0' }}>
              • {e.categoryLabel} – {e.stateName}
            </div>
          ))}
        </div>
      </>
    );
  } else {
    // LOW
    body = (
      <div style={{ fontSize: '0.68rem', color: '#aaa', marginTop: 8 }}>
        {risk.totalDistinctEvents} minor event{risk.totalDistinctEvents === 1 ? '' : 's'} in major egg-producing states
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'Menlo, monospace' }}>
      <div style={{ fontSize: '1.1rem', fontWeight: 700, color, letterSpacing: '0.03em' }}>
        {risk.level === 'NONE' ? 'NO ACTIVE THREATS' : risk.level}
      </div>
      {body}
      {data.lastUpdated && (
        <div style={{ marginTop: 'auto', paddingTop: 6, fontSize: '0.56rem', color: '#555' }}>
          Updated {timeAgo(data.lastUpdated)}
        </div>
      )}
    </div>
  );
}
