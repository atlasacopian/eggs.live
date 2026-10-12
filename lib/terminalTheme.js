// EGGS.LIVE terminal theme - bright, saturated palette (the muted version
// read as "dull"). Each color has one fixed role, used consistently
// everywhere it appears.

export const YELLOW = '#FFE234';   // highlighted/attention figures (outbreak counts, alerts)
export const ORANGE = '#FF8C3D';   // store/ticker names, primary identifiers
export const BLUE = '#2E8BFF';     // "Regular" price identity, primary nav/active state
export const PURPLE = '#B355FF';   // "Organic" price identity
export const RED = '#FF3B3B';      // negative moves, outbreaks
export const GREEN = '#2ED573';    // positive moves

export const WHITE = '#FFFFFF';    // primary values
export const GRAY = '#9a9a9a';     // column headers, secondary labels

export const UP = GREEN;
export const DOWN = RED;
export const NEUTRAL = '#888';

// Back-compat aliases for older call sites.
export const GOLD = ORANGE;
export const ACCENT = ORANGE;
export const CYAN = BLUE;
export const SIGNAL = BLUE;

export const PAGE_BG = '#000000';
export const PANEL_BG = '#000000';
export const PANEL_BORDER = '#242424';
export const ROW_BORDER = '#1a1a1a';
// Charts stay pure black like everything else now - no separate navy body.
export const CHART_BG = '#000000';

export const sectionHeaderStyle = {
  color: '#fff',
  fontSize: '0.7rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  paddingBottom: 4,
  marginBottom: 6,
  borderBottom: `1px solid ${PANEL_BORDER}`,
};

export function changeColor(change) {
  if (typeof change !== 'number') return NEUTRAL;
  return change > 0 ? UP : change < 0 ? DOWN : NEUTRAL;
}

export function changeSign(change) {
  if (typeof change !== 'number') return '';
  return change > 0 ? '▲' : change < 0 ? '▼' : '→';
}

export function changeArrow(change) {
  return changeSign(change);
}

export const citationStyle = {
  fontSize: '0.62rem',
  color: '#666',
  fontStyle: 'italic',
  letterSpacing: '0.02em',
};

export const SERIF = 'Menlo, monospace';

// "Quiet terminal" tokens for the ZIP view: Apple-dark surfaces and type,
// monospace kept for every number so prices still read like a terminal.
export const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Helvetica Neue", Arial, sans-serif';
export const MONO = 'ui-monospace, "SF Mono", var(--font-roboto-mono), Menlo, monospace';
export const SURFACE = '#0d0d0e';
export const SURFACE_HI = '#1c1c1e';
export const HAIRLINE = '#1f1f22';
export const TEXT = '#f5f5f7';
export const TEXT_2 = '#a1a1a6';
export const TEXT_3 = '#6e6e73';
export const TYPE_COLOR = { regular: '#0a84ff', organic: '#bf5af2' };
export const TYPE_LABEL = { regular: 'Regular', organic: 'Organic' };
export const GOOD = '#30d158';
export const BAD = '#ff453a';
