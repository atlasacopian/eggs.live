// Weather Risk module constants - shared between the hourly collector
// (scripts/fetch-weather-alerts.js) and the API route
// (app/api/weather-risk/route.js) so the two never drift apart.

// All 50 U.S. states (USPS codes) - the NWS API's `area` query param.
export const ALL_50_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

// The 28 states USDA NASS individually discloses in the Chickens and Eggs
// monthly report's state-level tables ("Layers on Hand and Eggs Produced -
// States and United States"). Verified against the actual report (and
// confirmed via the Quick Stats API that no state beyond this list has
// individually-disclosed table-egg layer data at all - the rest are folded
// into "Other States" because too few operations exist there to disclose
// without identifying a single company's numbers). This is the objective
// ceiling of USDA's state-level disclosure, not a subjective pick - alerts
// in these states are prioritized in the Weather Risk module's ordering.
export const MAJOR_PRODUCER_STATES = [
  'AL', 'AR', 'CA', 'CO', 'GA', 'IL', 'IN', 'IA', 'KY', 'MD',
  'MI', 'MN', 'MS', 'MO', 'NE', 'NY', 'NC', 'OH', 'OK', 'OR',
  'PA', 'SC', 'SD', 'TX', 'UT', 'VA', 'WA', 'WI',
];

export const MAJOR_PRODUCER_STATE_SET = new Set(MAJOR_PRODUCER_STATES);

// Maps NWS's official event-type strings (see /alerts/types) to the 7
// production-risk categories. Only events listed here are stored - anything
// else NWS issues (Air Quality Alert, Rip Current Statement, etc.) is
// ignored as not plausibly relevant to egg production/transportation.
export const EVENT_TYPE_TO_CATEGORY = {
  'Extreme Heat Warning': 'extreme_heat',
  'Extreme Heat Watch': 'extreme_heat',
  'Heat Advisory': 'extreme_heat',

  'Extreme Cold Warning': 'extreme_cold',
  'Extreme Cold Watch': 'extreme_cold',
  'Cold Weather Advisory': 'extreme_cold',

  'Winter Storm Warning': 'winter_storm',
  'Winter Storm Watch': 'winter_storm',
  'Winter Weather Advisory': 'winter_storm',
  'Ice Storm Warning': 'winter_storm',
  'Blizzard Warning': 'winter_storm',
  'Lake Effect Snow Warning': 'winter_storm',

  'Flood Warning': 'flooding',
  'Flood Watch': 'flooding',
  'Flash Flood Warning': 'flooding',
  'Flash Flood Watch': 'flooding',
  'Coastal Flood Warning': 'flooding',
  'Coastal Flood Watch': 'flooding',
  'Lakeshore Flood Warning': 'flooding',
  'Lakeshore Flood Watch': 'flooding',

  'Hurricane Warning': 'hurricane',
  'Hurricane Watch': 'hurricane',
  'Tropical Storm Warning': 'hurricane',
  'Tropical Storm Watch': 'hurricane',
  'Storm Surge Warning': 'hurricane',
  'Storm Surge Watch': 'hurricane',
  'Hurricane Force Wind Warning': 'hurricane',
  'Hurricane Force Wind Watch': 'hurricane',

  'Severe Thunderstorm Warning': 'severe_thunderstorm',
  'Severe Thunderstorm Watch': 'severe_thunderstorm',

  'High Wind Warning': 'high_wind',
  'High Wind Watch': 'high_wind',

  'Tornado Warning': 'tornado',
  'Tornado Watch': 'tornado',
};

// Sort weight for NWS's own severity field (Extreme/Severe/Moderate/Minor/
// Unknown) - used only for ordering, never displayed in place of the real
// value.
export const SEVERITY_RANK = {
  Extreme: 4,
  Severe: 3,
  Moderate: 2,
  Minor: 1,
  Unknown: 0,
};

export const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

export const CATEGORY_LABELS = {
  extreme_heat: 'Extreme Heat',
  extreme_cold: 'Extreme Cold',
  winter_storm: 'Winter Storm',
  flooding: 'Flooding',
  hurricane: 'Hurricane/Tropical Storm',
  severe_thunderstorm: 'Severe Thunderstorm',
  high_wind: 'High Wind',
  tornado: 'Tornado',
};

// Market-risk methodology thresholds - both are the only judgment calls in
// this logic, disclosed here rather than buried as magic numbers.
const HIGH_RISK_MIN_STATES = 5;
const MODERATE_RISK_MIN_SIGNIFICANT_EVENTS = 3;
const SIGNIFICANT_SEVERITIES = new Set(['Extreme', 'Severe']);

// Reduces the raw per-NWS-zone alert list down to "is weather currently
// creating meaningful risk for the U.S. egg market?" - HIGH/MODERATE/LOW/NONE,
// computed only from real stored fields (category, state, severity,
// isMajorProducer). No invented composite score.
//
// Rules (evaluated top-down, first match wins):
//   HIGH     - one category affects >= HIGH_RISK_MIN_STATES major-producer
//              states, at Severe/Extreme severity - a single hazard broadly
//              hitting the producing region at real intensity.
//   MODERATE - >= MODERATE_RISK_MIN_SIGNIFICANT_EVENTS distinct
//              (category, state) pairs at Severe/Extreme severity in major-
//              producer states, even if scattered across categories/states.
//   LOW      - at least one alert in a major-producer state, but doesn't
//              clear the MODERATE bar.
//   NONE     - zero alerts in major-producer states.
export function computeMarketRisk(alerts) {
  const majorAlerts = (alerts || []).filter(a => a.isMajorProducer);

  // De-dupe to one entry per (category, state), keeping the highest
  // severity seen across that state's NWS zone-level alerts for the category.
  const byCategoryState = new Map();
  for (const a of majorAlerts) {
    const key = `${a.category}::${a.state}`;
    const rank = SEVERITY_RANK[a.severity] ?? 0;
    const existing = byCategoryState.get(key);
    if (!existing || rank > existing.severityRank) {
      byCategoryState.set(key, {
        category: a.category,
        categoryLabel: a.categoryLabel || CATEGORY_LABELS[a.category] || a.category,
        state: a.state,
        stateName: STATE_NAMES[a.state] || a.state,
        severity: a.severity,
        severityRank: rank,
      });
    }
  }
  const distinct = [...byCategoryState.values()];

  // Group by category to find the dominant one (most states affected, tie
  // broken by higher max severity).
  const byCategory = new Map();
  for (const entry of distinct) {
    if (!byCategory.has(entry.category)) {
      byCategory.set(entry.category, { states: new Set(), maxSeverityRank: 0, maxSeverity: 'Unknown' });
    }
    const cat = byCategory.get(entry.category);
    cat.states.add(entry.state);
    if (entry.severityRank > cat.maxSeverityRank) {
      cat.maxSeverityRank = entry.severityRank;
      cat.maxSeverity = entry.severity;
    }
  }

  let dominant = null;
  for (const [category, cat] of byCategory) {
    if (
      !dominant ||
      cat.states.size > dominant.stats.states.size ||
      (cat.states.size === dominant.stats.states.size && cat.maxSeverityRank > dominant.stats.maxSeverityRank)
    ) {
      dominant = { category, stats: cat };
    }
  }

  const significantEvents = distinct.filter(e => SIGNIFICANT_SEVERITIES.has(e.severity));
  const minorEvents = distinct.filter(e => !SIGNIFICANT_SEVERITIES.has(e.severity));

  let level = 'NONE';
  if (dominant && dominant.stats.states.size >= HIGH_RISK_MIN_STATES && dominant.stats.maxSeverityRank >= SEVERITY_RANK.Severe) {
    level = 'HIGH';
  } else if (significantEvents.length >= MODERATE_RISK_MIN_SIGNIFICANT_EVENTS) {
    level = 'MODERATE';
  } else if (distinct.length >= 1) {
    level = 'LOW';
  }

  return {
    level,
    dominantCategory: dominant ? dominant.category : null,
    dominantCategoryLabel: dominant ? (CATEGORY_LABELS[dominant.category] || dominant.category) : null,
    dominantCategoryStates: dominant ? dominant.stats.states.size : 0,
    significantEventCount: significantEvents.length,
    significantEvents: significantEvents
      .sort((a, b) => b.severityRank - a.severityRank)
      .slice(0, 5)
      .map(e => ({ category: e.category, categoryLabel: e.categoryLabel, state: e.state, stateName: e.stateName, severity: e.severity })),
    minorEventCount: minorEvents.length,
    totalDistinctEvents: distinct.length,
    thresholds: {
      highRiskMinStates: HIGH_RISK_MIN_STATES,
      moderateRiskMinSignificantEvents: MODERATE_RISK_MIN_SIGNIFICANT_EVENTS,
    },
  };
}
