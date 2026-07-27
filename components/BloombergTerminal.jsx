import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TerminalTile from './TerminalTile.jsx';
import TerminalHeader from './TerminalHeader.jsx';
import StoreList from './StoreList.jsx';
import EggPriceChart from './EggPriceChart.jsx';
import UsdaPriceChart from './UsdaPriceChart.jsx';
import FredChart from './FredChart.jsx';
import EggNewsPanel from './EggNewsPanel.jsx';
import BirdFluPanel from './BirdFluPanel.jsx';
import LayingHenInventoryPanel from './LayingHenInventoryPanel.jsx';
import FeedCommoditiesPanel from './FeedCommoditiesPanel.jsx';
import WeatherRiskPanel from './WeatherRiskPanel.jsx';
import NationalStoreStats from './NationalStoreStats.jsx';
import StoreHeatMap from './StoreHeatMap.jsx';
import StateRankings from './StateRankings.jsx';
import StatePriceMap from './StatePriceMap.jsx';
import { SIGNAL, PAGE_BG, PANEL_BORDER, SERIF, BLUE, PURPLE, GREEN, RED, changeColor, changeSign } from '../lib/terminalTheme';

const MOBILE_BREAKPOINT = 768;

export default function BloombergTerminal({ zipCode, localStores = [], nationalStats = {}, showOnlyStoresAndHistory = false }) {
  const router = useRouter();
  const [view, setView] = useState('local'); // local | national
  const [editingZip, setEditingZip] = useState(false);
  const [tempZip, setTempZip] = useState(zipCode || '');

  useEffect(() => { setTempZip(zipCode || ''); }, [zipCode]);

  const handleZipSubmit = () => {
    setEditingZip(false);
    if (tempZip.match(/^\d{5}$/) && tempZip !== zipCode) {
      router.push(`/${tempZip}`);
    } else {
      setTempZip(zipCode || '');
    }
  };
  const [selectedStore, setSelectedStore] = useState(localStores[0] || null);
  const [hoveredStore, setHoveredStore] = useState(null);
  const [priceType, setPriceType] = useState('regular');
  const [isMobile, setIsMobile] = useState(false);
  const [storeSurveyStats, setStoreSurveyStats] = useState(null);
  const [storeSurveyError, setStoreSurveyError] = useState(null);
  const [nationalPulse, setNationalPulse] = useState(null);
  const [stateStats, setStateStats] = useState(null);
  const [stateStatsError, setStateStatsError] = useState(null);
  const [layerInventory, setLayerInventory] = useState(null);
  const [feedCommodities, setFeedCommodities] = useState(null);
  const [weatherRisk, setWeatherRisk] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      };
      window.addEventListener('resize', handleResize);
      handleResize(); // Initial check
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/national-store-stats')
      .then(res => res.json())
      .then(data => { if (!cancelled) setStoreSurveyStats(data); })
      .catch(err => { if (!cancelled) setStoreSurveyError(err.message); });
    return () => { cancelled = true; };
  }, []);

  // Fetched once here and passed down to both "Explore by State" and "Price
  // by State" (and used for the Coverage panel's state count) - each used to
  // fetch this independently, which tripled concurrent load on an already
  // slow query and pushed it past Supabase's statement timeout.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/state-price-stats')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data.error) setStateStatsError(data.error);
        else setStateStats(data.states || []);
      })
      .catch(err => { if (!cancelled) setStateStatsError(err.message); });
    return () => { cancelled = true; };
  }, []);

  // USDA NASS table-egg layer inventory - the panel only renders once
  // `ready` comes back true, so a missing/delayed monthly release just means
  // no module, never a broken-looking one (see LayingHenInventoryPanel).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/usda-layer-inventory')
      .then(res => res.json())
      .then(data => { if (!cancelled) setLayerInventory(data); })
      .catch(() => { if (!cancelled) setLayerInventory(null); });
    return () => { cancelled = true; };
  }, []);

  // Corn (USDA NASS) + soybean meal (FRED PPI) - two independent series, no
  // blended index. Panel only renders once both are ready (see
  // FeedCommoditiesPanel).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/feed-commodities')
      .then(res => res.json())
      .then(data => { if (!cancelled) setFeedCommodities(data); })
      .catch(() => { if (!cancelled) setFeedCommodities(null); });
    return () => { cancelled = true; };
  }, []);

  // NWS active weather alerts in production-risk categories, all 50 states,
  // major-egg-producing states ranked first (see WeatherRiskPanel).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/weather-risk')
      .then(res => res.json())
      .then(data => { if (!cancelled) setWeatherRisk(data); })
      .catch(() => { if (!cancelled) setWeatherRisk(null); });
    return () => { cancelled = true; };
  }, []);

  // Powers the persistent national-context strip - shown regardless of
  // whether a zip is focused. The whole point of "The National Ledger" is
  // that a single zip code's prices are never shown in isolation; this is
  // the same live national reading no matter what's focused below it.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/national-egg-stats')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const reg = data.priceHistoryRegular || [];
        const org = data.priceHistoryOrganic || [];
        const latestReg = reg[reg.length - 1]?.value ?? null;
        const prevReg = reg[reg.length - 2]?.value ?? null;
        const latestOrg = org[org.length - 1]?.value ?? null;
        setNationalPulse({
          regular: latestReg,
          organic: latestOrg,
          regularChangePct: latestReg != null && prevReg ? ((latestReg - prevReg) / prevReg) * 100 : null,
        });
      })
      .catch(() => { if (!cancelled) setNationalPulse(null); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (localStores.length && selectedStore === null) {
      setSelectedStore(localStores[0]);
    }
  }, [localStores, selectedStore]);

  const getSpan = (desktopSpan) => (isMobile ? 1 : desktopSpan);

  const storeListMaxHeight = showOnlyStoresAndHistory
    ? 'calc(100vh - 260px)'
    : '400px';

  const localStoresRowMinHeight =
    showOnlyStoresAndHistory && !isMobile ? 'calc(100vh - 240px)' : undefined;

  // Regional headline stats, computed entirely from the real store data
  // already fetched for this zip - no placeholder/random values.
  const regularPrices = localStores.map(s => s.regular_price).filter(p => typeof p === 'number');
  const organicPrices = localStores.map(s => s.organic_price).filter(p => typeof p === 'number');
  const lowestRegular = regularPrices.length ? Math.min(...regularPrices) : null;
  const lowestOrganic = organicPrices.length ? Math.min(...organicPrices) : null;
  const regChanges = localStores.map(s => s.regular_change).filter(c => typeof c === 'number');
  const avgRegChange = regChanges.length ? regChanges.reduce((a, b) => a + b, 0) / regChanges.length : null;

  // How the cheapest price near you stacks up against the national average -
  // the whole reason that average is shown at all is as a yardstick for this
  // number, so state the comparison directly instead of making people do the
  // math between two separate figures themselves.
  const vsNationalPct = (local, national) =>
    typeof local === 'number' && typeof national === 'number' && national !== 0
      ? ((local - national) / national) * 100
      : null;
  const vsNationalRegularPct = vsNationalPct(lowestRegular, nationalPulse?.regular);
  const vsNationalOrganicPct = vsNationalPct(lowestOrganic, nationalPulse?.organic);
  // Cheaper than the national average is the good outcome here, so it's
  // colored green regardless of the generic up=green/down=red convention
  // used for plain price-over-time moves elsewhere.
  const dealColor = (pct) => (pct == null ? '#888' : pct < 0 ? GREEN : pct > 0 ? RED : '#888');
  const dealArrow = (pct) => (pct == null ? '' : pct < 0 ? '▼' : pct > 0 ? '▲' : '→');

  // Compact "1.2K" / "3.4M" formatting for large counts (data points can run
  // into the millions).
  const formatCount = (n) => {
    if (n == null) return '--';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  const labelStyle = { color: SIGNAL, fontSize: '0.62rem', letterSpacing: '0.1em', fontWeight: 600, textTransform: 'uppercase' };

  return (
    <div
      style={{
        padding: isMobile ? 4 : 6,
        background: PAGE_BG,
        color: '#fff',
        minHeight: '100vh',
      }}
    >
      <TerminalHeader
        zipCode={zipCode}
        view={view}
        onSetView={setView}
        isMobile={isMobile}
      />

      {/* Persistent local-context strip. The cheapest price near you is the
          entire point of this page, so it leads - big and first - with the
          national average folded in as a direct "vs national avg" comparison
          right underneath it, instead of as a separate, disconnected figure
          the reader has to do their own math against. */}
      {view === 'local' && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: isMobile ? 10 : 20,
            padding: isMobile ? '4px 2px' : '5px 4px',
            marginTop: isMobile ? 4 : 5,
            borderBottom: `1px solid ${PANEL_BORDER}`,
            fontFamily: 'Menlo, monospace',
          }}
        >
          <div>
            <div style={labelStyle}>
              {editingZip ? (
                <input
                  value={tempZip}
                  onChange={e => setTempZip(e.target.value)}
                  onBlur={handleZipSubmit}
                  onKeyDown={e => { if (e.key === 'Enter') handleZipSubmit(); }}
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  autoFocus
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    color: 'inherit',
                    font: 'inherit',
                    width: 44,
                    padding: 0,
                  }}
                />
              ) : (
                <span
                  onClick={() => { setTempZip(zipCode || ''); setEditingZip(true); }}
                  style={{ cursor: 'pointer' }}
                  title="Click to change ZIP"
                >
                  {zipCode || 'This Area'}
                </span>
              )}
              {' '}· Lowest Prices (3mi)
            </div>
            {/* One row per price type instead of two separate stacked cards -
                label, price, 7-day move, and the national comparison all line
                up in columns so the eye reads left-to-right once, not a
                scattered mix of stacked mini-blocks. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto 1fr', columnGap: isMobile ? 8 : 12, rowGap: 2, alignItems: 'baseline', marginTop: 3 }}>
              <span style={{ color: BLUE, fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.04em' }}>REG</span>
              <span style={{ fontSize: isMobile ? '1.3rem' : '1.55rem', fontWeight: 700, lineHeight: 1 }}>
                {lowestRegular != null ? `$${lowestRegular.toFixed(2)}` : '--'}
              </span>
              <span style={{ color: changeColor(avgRegChange), fontSize: '0.72rem', fontWeight: 700 }}>
                {avgRegChange != null ? `${changeSign(avgRegChange)}${Math.abs(avgRegChange).toFixed(1)}%` : ''}
              </span>
              <span style={{ fontSize: '0.64rem', color: '#777' }}>
                {vsNationalRegularPct != null && (
                  <>
                    <span style={{ color: dealColor(vsNationalRegularPct), fontWeight: 700 }}>
                      {dealArrow(vsNationalRegularPct)}{Math.abs(vsNationalRegularPct).toFixed(0)}%
                    </span> vs natl avg ${nationalPulse.regular.toFixed(2)}
                  </>
                )}
              </span>

              <span style={{ color: PURPLE, fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.04em' }}>ORG</span>
              <span style={{ fontSize: isMobile ? '1.3rem' : '1.55rem', fontWeight: 700, lineHeight: 1 }}>
                {lowestOrganic != null ? `$${lowestOrganic.toFixed(2)}` : '--'}
              </span>
              <span />
              <span style={{ fontSize: '0.64rem', color: '#777' }}>
                {vsNationalOrganicPct != null && (
                  <>
                    <span style={{ color: dealColor(vsNationalOrganicPct), fontWeight: 700 }}>
                      {dealArrow(vsNationalOrganicPct)}{Math.abs(vsNationalOrganicPct).toFixed(0)}%
                    </span> vs natl avg ${nationalPulse.organic.toFixed(2)}
                  </>
                )}
              </span>
            </div>
          </div>

          <div style={{ width: 1, alignSelf: 'stretch', background: PANEL_BORDER }} />

          <div>
            <div style={labelStyle}>Stores Tracked (Natl)</div>
            <div style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 700 }}>
              {formatCount(storeSurveyStats?.totalStores)}
            </div>
          </div>
        </div>
      )}

      {/* HERO ROW - the national map + a compact Bird Flu strip. News moves
          to its own row at the bottom of the page - it's reference reading,
          not the first thing you need to see. */}
      {view === 'national' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${isMobile ? 1 : 8}, 1fr)`,
          gap: 1,
          marginTop: 1,
        }}>
          <TerminalTile
            title="Current National Prices"
            live
            span={getSpan(2)}
            style={{ minHeight: isMobile ? '200px' : '210px', maxHeight: isMobile ? '200px' : '210px' }}
          >
            <UsdaPriceChart />
          </TerminalTile>

          <TerminalTile
            title="Store Coverage Map"
            live
            span={getSpan(2)}
            style={{ minHeight: isMobile ? '200px' : '210px', maxHeight: isMobile ? '200px' : '210px' }}
          >
            <StoreHeatMap
              points={storeSurveyStats?.points}
              bounds={storeSurveyStats?.conusBounds}
              error={storeSurveyError}
            />
          </TerminalTile>

          <TerminalTile
            title="Price by State"
            live
            span={getSpan(2)}
            style={{ minHeight: isMobile ? '200px' : '210px', maxHeight: isMobile ? '200px' : '210px' }}
          >
            <StatePriceMap stats={stateStats} error={stateStatsError} />
          </TerminalTile>

          <TerminalTile
            title="Historical National Prices"
            span={getSpan(2)}
            style={{ minHeight: isMobile ? '200px' : '210px', maxHeight: isMobile ? '200px' : '210px' }}
          >
            <FredChart symbol="APU0000703111" start="1980-01-01" showTimestamp={true} />
          </TerminalTile>
        </div>
      )}

      {/* FOCUS ROW - the zip-code view: just the store list + chart, no
          national map/signals on top. */}
      {view === 'local' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${isMobile ? 1 : 7}, 1fr)`,
          gap: 1,
          marginTop: 1,
        }}>
          <TerminalTile
            title={`Latest Store Prices (${localStores.length} within 3mi)`}
            span={getSpan(5)}
            style={{ minHeight: isMobile ? '200px' : localStoresRowMinHeight || 'auto' }}
          >
            <StoreList
              stores={localStores}
              selectedStore={selectedStore}
              setSelectedStore={setSelectedStore}
              hoveredStore={hoveredStore}
              setHoveredStore={setHoveredStore}
              priceType={priceType}
              isMobile={isMobile}
              maxListHeight={storeListMaxHeight}
              zipCode={zipCode}
            />
          </TerminalTile>
          <TerminalTile
            title="Store Price History"
            span={getSpan(2)}
            style={{ minHeight: isMobile ? '200px' : localStoresRowMinHeight || 'auto' }}
          >
            <EggPriceChart selectedStore={selectedStore} isMobile={isMobile} zipCode={zipCode} priceType={priceType} onPriceTypeChange={setPriceType} />
          </TerminalTile>
        </div>
      )}

      {/* REFERENCE ROW - Bird Flu detections + Coverage field readout,
          underneath the graphs/map row above. */}
      {view === 'national' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${isMobile ? 1 : 8}, 1fr)`,
          gap: 1,
          marginTop: 1,
        }}>
          <TerminalTile
            title="Bird Flu (HPAI) Detections"
            span={getSpan(3)}
            style={{ minHeight: isMobile ? '190px' : '190px', maxHeight: isMobile ? '190px' : '190px' }}
          >
            <BirdFluPanel />
          </TerminalTile>

          <TerminalTile
            title="Weather Risk"
            span={getSpan(2)}
            style={{ minHeight: isMobile ? '190px' : '190px', maxHeight: isMobile ? '190px' : '190px' }}
          >
            <WeatherRiskPanel data={weatherRisk} />
          </TerminalTile>

          {layerInventory?.ready && (
            <TerminalTile
              title="Laying Hen Inventory"
              span={getSpan(2)}
              style={{ minHeight: isMobile ? '190px' : '190px', maxHeight: isMobile ? '190px' : '190px' }}
            >
              <LayingHenInventoryPanel data={layerInventory} />
            </TerminalTile>
          )}

          <TerminalTile
            title="Coverage"
            span={getSpan(2)}
            style={{ minHeight: isMobile ? '190px' : '190px', maxHeight: isMobile ? '190px' : '190px' }}
          >
            {/* A real terminal doesn't render stats as centered stat cards -
                it's a line-item list, label left, value right, like a field
                readout. */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', fontFamily: 'Menlo, monospace' }}>
              {[
                ['Avg Regular', (
                  <>
                    {nationalPulse?.regular != null ? `$${nationalPulse.regular.toFixed(2)}` : '--'}
                    {nationalPulse?.regularChangePct != null && (
                      <span style={{ color: changeColor(nationalPulse.regularChangePct), fontSize: '0.62rem', marginLeft: 6 }}>
                        {changeSign(nationalPulse.regularChangePct)}{Math.abs(nationalPulse.regularChangePct).toFixed(1)}%
                      </span>
                    )}
                  </>
                )],
                ['Avg Organic', nationalPulse?.organic != null ? `$${nationalPulse.organic.toFixed(2)}` : '--'],
                ['Stores Tracked', formatCount(storeSurveyStats?.totalStores)],
                ['States Tracked', stateStats?.length ?? '--'],
                ['Zip Codes', formatCount(storeSurveyStats?.totalZips)],
                ['Brands', storeSurveyStats?.brands?.length ?? '--'],
                ['Data Points', formatCount(storeSurveyStats?.totalDataPoints)],
              ].map(([label, value], i, arr) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    padding: '4px 2px',
                    borderBottom: i < arr.length - 1 ? `1px solid ${PANEL_BORDER}` : 'none',
                  }}
                >
                  <span style={{ fontSize: '0.64rem', color: '#888', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{value}</span>
                </div>
              ))}
            </div>
          </TerminalTile>

          <TerminalTile
            title="Stores Surveyed by Brand"
            span={getSpan(2)}
            style={{ minHeight: isMobile ? '160px' : '190px', maxHeight: isMobile ? '160px' : '190px' }}
          >
            <NationalStoreStats stats={storeSurveyStats} error={storeSurveyError} />
          </TerminalTile>

          <TerminalTile
            title="Explore by State"
            span={getSpan(2)}
            style={{ minHeight: isMobile ? '160px' : '190px', maxHeight: isMobile ? '160px' : '190px' }}
          >
            <StateRankings stats={stateStats} error={stateStatsError} />
          </TerminalTile>

          {/* News shares this row now instead of its own full-width row
              below - reference reading, not the headline surface, so it
              doesn't need to dominate the layout. */}
          <TerminalTile
            title="News"
            live
            span={getSpan(2)}
            style={{ minHeight: isMobile ? '160px' : '190px', maxHeight: isMobile ? '160px' : '190px' }}
          >
            <EggNewsPanel fontSize={isMobile ? '0.7rem' : '0.72rem'} />
          </TerminalTile>

          {feedCommodities?.corn?.ready && feedCommodities?.soybeanMeal?.ready && (
            <TerminalTile
              title="Feed Commodities"
              span={getSpan(2)}
              style={{ minHeight: isMobile ? '160px' : '190px', maxHeight: isMobile ? '160px' : '190px' }}
            >
              <FeedCommoditiesPanel data={feedCommodities} />
            </TerminalTile>
          )}
        </div>
      )}
    </div>
  );
}
