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
async function fetchAllRows(sb, table, select) {
  const pageSize = 1000;
  let from = 0;
  let allRows = [];
  while (true) {
    const { data, error } = await sb.from(table).select(select).range(from, from + pageSize - 1);
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
    const [krogerRows, targetRows] = await Promise.all([
      fetchAllRows(sb, 'kroger_stores_1500', 'brand, latitude, longitude'),
      fetchAllRows(sb, 'target_stores', 'latitude, longitude'),
    ]);

    const brandCounts = {};
    const points = [];

    for (const row of krogerRows) {
      const rawBrand = (row.brand || '').trim();
      if (EXCLUDED_KROGER_BRANDS.has(rawBrand)) continue;
      const label = KROGER_BRAND_LABELS[rawBrand] || rawBrand || 'Kroger';
      brandCounts[label] = (brandCounts[label] || 0) + 1;
      if (row.latitude != null && row.longitude != null) {
        points.push({ lat: row.latitude, lng: row.longitude, b: 'k' });
      }
    }

    for (const row of targetRows) {
      brandCounts['Target'] = (brandCounts['Target'] || 0) + 1;
      if (row.latitude != null && row.longitude != null) {
        points.push({ lat: row.latitude, lng: row.longitude, b: 't' });
      }
    }

    const brands = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count);

    const totalStores = brands.reduce((sum, b) => sum + b.count, 0);

    return Response.json({
      totalStores,
      brands,
      points,
      conusBounds: CONUS_BOUNDS,
    });
  } catch (e) {
    console.error('national-store-stats error:', e);
    return Response.json({ totalStores: 0, brands: [], points: [] }, { status: 200 });
  }
}
