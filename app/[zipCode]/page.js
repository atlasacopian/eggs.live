// Enable server-side rendering for this dynamic route
export const dynamic = 'force-dynamic';

// Import dynamic for client-only chart
import dynamic from 'next/dynamic';
import TickerStrip from '../../components/TickerStrip.jsx';

// Dynamically load the client component without SSR
const ZipFREDChart = dynamic(
  () => import('../../components/ZipFREDChart.jsx'),
  { ssr: false }
);

export default function ZipCodePage({ params }) {
  const { zipCode } = params;
  return (
    <main style={{ background: '#000', color: '#fff', minHeight: '100vh', padding: 24 }}>
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 }}>
        <TickerStrip text={`ZIP ${zipCode} – Historical US Egg Prices`} fontSize="10px" overrideBackgroundColor="#000" />
      </div>
      <div style={{ marginTop: 80, maxWidth: 960, marginInline: 'auto' }}>
        <ZipFREDChart />
      </div>
    </main>
  );
}