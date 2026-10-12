import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TerminalTile from './TerminalTile.jsx';
import TerminalHeader from './TerminalHeader.jsx';
import ZipView from './ZipView.jsx';
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
import { PAGE_BG, PANEL_BORDER, changeColor, changeSign } from '../lib/terminalTheme';

const MOBILE_BREAKPOINT = 768;

export default function BloombergTerminal({ zipCode, localStores = [], radiusMiles = 3, nationalStats = {}, showOnlyStoresAndHistory = false }) {
  const router = useRouter();
  const [view, setView] = useState('local'); // local | national
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

  // Compact "1.2K" / "3.4M" formatting for large counts (data points can run
  // into the millions).
  const formatCount = (n) => {
    if (n == null) return '--';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };


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

      {view === 'local' && (
        <ZipView
          zipCode={zipCode}
          stores={localStores}
          radiusMiles={radiusMiles}
          nationalPulse={nationalPulse}
          isMobile={isMobile}
          selectedStore={selectedStore}
          setSelectedStore={setSelectedStore}
          hoveredStore={hoveredStore}
          setHoveredStore={setHoveredStore}
          priceType={priceType}
          setPriceType={setPriceType}
          onZipSubmit={zip => router.push(`/${zip}`)}
        />
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
