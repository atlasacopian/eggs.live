import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// Prunes the set of Kroger stores marked for daily price tracking
// (kroger_stores.tracked_since IS NOT NULL) down to a maximum count,
// keeping any store in a must-keep state/city. Never deletes a store row
// itself - only clears tracked_since to stop scraping it.
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  KROGER_STATE_FILTER,
  KROGER_CITY_FILTER,
  KROGER_MAX_TOTAL_STORES,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env.local');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getAllTrackedStores() {
  const all = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('kroger_stores')
      .select('location_id, city, state')
      .not('tracked_since', 'is', null)
      .range(from, from + pageSize - 1);
    if (error) {
      console.error('❌ Error fetching tracked stores:', error);
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
  console.log(`🔧 Pruning tracked Kroger stores to a maximum of ${KROGER_MAX_TOTAL_STORES}...`);

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

  const trackedStores = await getAllTrackedStores();
  console.log(`Total currently tracked stores: ${trackedStores.length}`);

  const mustKeep = [];
  const others = [];
  for (const row of trackedStores) {
    const state = row.state?.toUpperCase();
    const city = row.city?.toUpperCase();
    if (stateFilter.includes(state) || cityFilter.includes(city)) {
      mustKeep.push(row);
    } else {
      others.push(row);
    }
  }

  console.log(`Must-keep stores (filtered by state/city): ${mustKeep.length}`);
  console.log(`Other tracked stores eligible for pruning: ${others.length}`);

  if (mustKeep.length > maxTotal) {
    console.warn('⚠️ Must-keep count exceeds maximum total; no pruning will be performed.');
    process.exit(0);
  }

  const slots = maxTotal - mustKeep.length;
  console.log(`Slots available for other stores: ${slots}`);

  const toUntrack = others.slice(slots).map(r => r.location_id);
  if (toUntrack.length === 0) {
    console.log('✅ No additional stores need to be untracked.');
    process.exit(0);
  }

  console.log(`Untracking ${toUntrack.length} stores...`);
  const { error: updateError } = await sb
    .from('kroger_stores')
    .update({ tracked_since: null })
    .in('location_id', toUntrack);
  if (updateError) {
    console.error('❌ Error untracking stores:', updateError);
    process.exit(1);
  }

  console.log(`✅ Untracked ${toUntrack.length} stores. ${maxTotal} stores now tracked.`);
})();
