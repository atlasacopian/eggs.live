// Mock store data – replace later with Supabase query
// const SAMPLE_STORES = [
//   { id:1, name:'Ralphs',      address:'2600 Vermont Ave, Los Angeles, CA 90026', regular_price:7.79, organic_price:9.49 },
//   { id:2, name:'Food 4 Less', address:'1748 Sunset Blvd, Los Angeles, CA 90026', regular_price:8.03, organic_price:9.99 },
//   { id:3, name:"Trader Joe's",address:'1600 Vine St, Los Angeles, CA 90028',    regular_price:5.49, organic_price:7.99 },
// ]

export async function getStoresNearZip(zip) {
  const url = `/api/stores?zip=${zip}`
  const res = await fetch(url, { cache:'no-store' })
  if (!res.ok) throw new Error('Failed to load stores')
  const { stores, lastUpdated, avgRegLA, avgOrgLA, avgRegNat, avgRegNatDate, avgOrgNat, avgOrgNatDate } = await res.json()
  // Only include stores within 3 miles
  const nearby = stores.filter(s => s.distance != null && s.distance <= 3)
  return { stores: nearby, lastUpdated, avgRegLA, avgOrgLA, avgRegNat, avgRegNatDate, avgOrgNat, avgOrgNatDate }
} 