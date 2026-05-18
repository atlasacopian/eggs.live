import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  KROGER_STORES_TABLE = 'kroger_stores',
  KROGER_STATE_FILTER,
  KROGER_CITY_FILTER,
  KROGER_MAX_TOTAL_STORES,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getAllStores() {
  const all = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from(KROGER_STORES_TABLE)
      .select('location_id, city, state')
      .range(from, from + pageSize - 1);
    if (error) {
      console.error('❌ Error fetching stores:', error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

(async () => {
  console.log(`🔧 Pruning table ${KROGER_STORES_TABLE} to a maximum of ${KROGER_MAX_TOTAL_STORES} stores...`);

  const maxTotal = Number(KROGER_MAX_TOTAL_STORES);
  if (isNaN(maxTotal) || maxTotal <= 0) {
    console.error('❌ KROGER_MAX_TOTAL_STORES must be a positive number');
    process.exit(1);
  }

  const stateFilter = KROGER_STATE_FILTER
    ? KROGER_STATE_FILTER.split(',').map(s => s.trim().toUpperCase())
    : [];
  const cityFilter = KROGER_CITY_FILTER
    ? KROGER_CITY_FILTER.split(',').map(s => s.trim().toUpperCase())
    : [];

  const allStores = await getAllStores();
  console.log(`Total stores in ${KROGER_STORES_TABLE}: ${allStores.length}`);

  const mustKeep = [];
  const others = [];
  for (const row of allStores) {
    const state = row.state?.toUpperCase();
    const city = row.city?.toUpperCase();
    if (stateFilter.includes(state) || cityFilter.includes(city)) {
      mustKeep.push(row);
    } else {
      others.push(row);
    }
  }

  console.log(`Must-keep stores (filtered by state/city): ${mustKeep.length}`);
  console.log(`Other stores eligible for pruning: ${others.length}`);

  if (mustKeep.length > maxTotal) {
    console.warn('⚠️ Must-keep count exceeds maximum total; no pruning will be performed.');
    process.exit(0);
  }

  const slots = maxTotal - mustKeep.length;
  console.log(`Slots available for other stores: ${slots}`);

  // Determine which other stores to delete: keep first `slots`, delete the rest
  const toDelete = others.slice(slots).map(r => r.location_id);
  if (toDelete.length === 0) {
    console.log('✅ No additional stores need to be deleted.');
    process.exit(0);
  }

  console.log(`Deleting ${toDelete.length} stores from ${KROGER_STORES_TABLE}...`);
  const { error: deleteError } = await sb
    .from(KROGER_STORES_TABLE)
    .delete()
    .in('location_id', toDelete);
  if (deleteError) {
    console.error('❌ Error deleting stores:', deleteError);
    process.exit(1);
  }

  console.log(`✅ Deleted ${toDelete.length} stores. Table now has ${maxTotal} entries.`);
})(); 