import { supabaseServer } from '../../../lib/supabase'

// Kroger's `brand` column holds internal banner codes - map them to display names.
// LAB_LOCATION entries are internal test locations, not real stores, and are excluded below.
const KROGER_BRAND_LABELS = {
  KROGER: 'Kroger',
  RALPHS: 'Ralphs',
  FOOD4LESS: 'Food 4 Less',
  KINGSOOPERS: 'King Soopers',
  FOODSCO: 'Foods Co',
  QFC: 'QFC',
  FRED: 'Fred Meyer',
  FRYS: "Fry's",
  MARIANOS: "Mariano's",
  HART: 'Harris Teeter',
  JAYC: 'Jay C',
  PAYLESS: 'Payless Super Markets',
};

const EXCLUDED_KROGER_BRANDS = new Set(['LAB LOCATION']);

// Continental US bounding box - used to keep the heatmap grid legible;
// AK/HI/PR stores are still counted in totals, just left out of the grid.
const CONUS_BOUNDS = { minLat: 24, maxLat: 50, minLng: -125, maxLng: -66 };

/** Fetch every row of a table/select, paging past Supabase's 1000-row default cap. */
async function fetchAllRows(sb, table, select, filter) {
  const pageSize = 1000;
  let from = 0;
  let allRows = [];
  while (true) {
    let query = sb.from(table).select(select).range(from, from + pageSize - 1);
    if (filter) query = filter(query);
    const { data, error } = await query;
    if (error) throw error;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return allRows;
}

export async function GET() {
  let sb;
  try {
    sb = supabaseServer();
  } catch (e) {
    return Response.json({ totalStores: 0, brands: [], points: [] }, { status: 200 });
  }

  try {
    const [krogerRows, targetRows, erewhonRows, krogerPriceCount, targetPriceCount, erewhonPriceCount] = await Promise.all([
      // kroger_stores holds every known Kroger-family location, but only the
      // subset with tracked_since set is actually scraped for prices (see
      // database/013) - counting untracked rows here would overstate
      // "Stores Tracked" by the ~1,400 stores that have no price data at all.
      fetchAllRows(sb, 'kroger_stores', 'brand, zip, latitude, longitude', q => q.not('tracked_since', 'is', null)),
      fetchAllRows(sb, 'target_stores', 'zip, latitude, longitude'),
      fetchAllRows(sb, 'erewhon_stores', 'zip, latitude, longitude'),
      // Only store-days that actually captured a price - a NO_DATA_FOUND /
      // FETCH_ERROR row is a failed scrape, not a data point.
      sb.from('kroger_egg_prices').select('*', { count: 'exact', head: true }).eq('status', 'OK').then(r => r.count || 0),
      sb.from('target_egg_prices').select('*', { count: 'exact', head: true }).eq('status', 'OK').then(r => r.count || 0),
      sb.from('erewhon_egg_prices').select('*', { count: 'exact', head: true }).eq('status', 'OK').then(r => r.count || 0),
    ]);

    const brandCounts = {};
    const points = [];
    const zips = new Set();

    for (const row of krogerRows) {
      const rawBrand = (row.brand || '').trim();
      if (EXCLUDED_KROGER_BRANDS.has(rawBrand)) continue;
      const label = KROGER_BRAND_LABELS[rawBrand] || rawBrand || 'Kroger';
      brandCounts[label] = (brandCounts[label] || 0) + 1;
      if (row.zip) zips.add(row.zip);
      if (row.latitude != null && row.longitude != null) {
        points.push({ lat: row.latitude, lng: row.longitude, b: 'k' });
      }
    }

    for (const row of targetRows) {
      brandCounts['Target'] = (brandCounts['Target'] || 0) + 1;
      if (row.zip) zips.add(row.zip);
      if (row.latitude != null && row.longitude != null) {
        points.push({ lat: row.latitude, lng: row.longitude, b: 't' });
      }
    }

    for (const row of erewhonRows) {
      brandCounts['Erewhon'] = (brandCounts['Erewhon'] || 0) + 1;
      if (row.zip) zips.add(row.zip);
      if (row.latitude != null && row.longitude != null) {
        points.push({ lat: row.latitude, lng: row.longitude, b: 'e' });
      }
    }

    const brands = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);

    const totalStores = brands.reduce((sum, b) => sum + b.count, 0);
    const totalDataPoints = krogerPriceCount + targetPriceCount + erewhonPriceCount;

    return Response.json({
      totalStores,
      totalZips: zips.size,
      totalDataPoints,
      brands,
      points,
      conusBounds: CONUS_BOUNDS,
    });
  } catch (e) {
    console.error('national-store-stats error:', e);
    return Response.json({ totalStores: 0, totalZips: 0, totalDataPoints: 0, brands: [], points: [] }, { status: 200 });
  }
}
