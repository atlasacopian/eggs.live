import { config } from 'dotenv'
config({ path: '.env.local' })
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import { runIfMain } from './lib/run-if-main.js'
import { ALL_50_STATES, MAJOR_PRODUCER_STATE_SET, EVENT_TYPE_TO_CATEGORY } from '../lib/weatherRiskConstants.js'

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY must be set')
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// NWS asks for a descriptive, contactable User-Agent instead of a generic
// client string - see https://www.weather.gov/documentation/services-web-api
const USER_AGENT = 'eggs.live weather-risk pipeline (contact: atlasacopian@gmail.com)'

async function main() {
  console.log('📡 Fetching NWS active alerts for all 50 states...')

  const url = new URL('https://api.weather.gov/alerts/active')
  url.searchParams.set('area', ALL_50_STATES.join(','))

  const res = await fetch(url.toString(), { headers: { 'User-Agent': USER_AGENT, Accept: 'application/geo+json' } })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`❌ NWS API request failed (${res.status}): ${text.slice(0, 300)}`)
    process.exit(1)
  }

  const json = await res.json()
  const features = json.features || []
  console.log(`   ↳ received ${features.length} total active alerts (all types, all states)`)

  const upserts = []
  let skippedCategory = 0
  let skippedNoState = 0

  for (const feature of features) {
    const p = feature.properties || {}
    const category = EVENT_TYPE_TO_CATEGORY[p.event]
    if (!category) {
      skippedCategory++
      continue
    }

    // A single alert can cover multiple states (e.g. a regional flood
    // watch). geocode.UGC zone/county codes are always state-code-prefixed
    // (e.g. "TXZ003", "OKZ002") - reliable, unlike areaDesc's free text,
    // which sometimes spells out the state name as its own segment instead
    // of "County, ST" (breaks any suffix-based parsing). We store one row
    // per (alert, state) pair so "prioritize major producer states" and
    // per-state display both work correctly - reuse the same NWS id with a
    // state suffix so it stays a stable, de-dupable key instead of colliding.
    const ugcCodes = (p.geocode && p.geocode.UGC) || [];
    const statesInAlert = new Set(
      ugcCodes
        .map(code => code.slice(0, 2))
        .filter(s => ALL_50_STATES.includes(s))
    )
    if (statesInAlert.size === 0) {
      skippedNoState++
      continue
    }

    for (const state of statesInAlert) {
      upserts.push({
        id: `${p.id}::${state}`,
        state,
        event_type: p.event,
        category,
        severity: p.severity || 'Unknown',
        headline: p.headline || null,
        source_url: p['@id'] || null,
        effective_at: p.effective || p.onset || null,
        expires_at: p.expires || p.ends || null,
        is_major_producer: MAJOR_PRODUCER_STATE_SET.has(state),
        fetched_at: new Date().toISOString(),
      })
    }
  }

  console.log(`   ↳ ${upserts.length} rows after filtering to production-risk categories (skipped ${skippedCategory} other-category alerts, ${skippedNoState} with no matching state)`)

  if (upserts.length) {
    const { error: upsertError } = await sb
      .from('weather_risk_alerts')
      .upsert(upserts, { onConflict: 'id' })
    if (upsertError) {
      console.error('❌ Upsert failed:', upsertError.message)
      process.exit(1)
    }
  }

  // Remove anything no longer in the current active-alerts feed - NWS
  // alerts can be cancelled/updated before their nominal expiry, so relying
  // solely on expires_at would leave stale cancelled alerts visible.
  const currentIds = new Set(upserts.map(u => u.id))
  const { data: existing, error: fetchExistingError } = await sb
    .from('weather_risk_alerts')
    .select('id')
  if (fetchExistingError) {
    console.error('❌ Failed to fetch existing rows for pruning:', fetchExistingError.message)
    process.exit(1)
  }

  const staleIds = (existing || []).map(r => r.id).filter(id => !currentIds.has(id))
  if (staleIds.length) {
    const { error: deleteError } = await sb
      .from('weather_risk_alerts')
      .delete()
      .in('id', staleIds)
    if (deleteError) {
      console.error('❌ Failed to prune stale alerts:', deleteError.message)
      process.exit(1)
    }
    console.log(`   ↳ pruned ${staleIds.length} expired/cancelled alert row(s)`)
  }

  console.log(`✅ ${upserts.length} active production-risk alerts stored (${upserts.filter(u => u.is_major_producer).length} in major-producer states).`)
}

runIfMain(main, import.meta.url)
