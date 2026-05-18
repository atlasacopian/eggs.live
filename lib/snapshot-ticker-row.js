/**
 * Map Massive/Polygon v2 snapshot ticker object → { symbol, price, change_pct, updated_at }.
 * Starter plans may omit lastTrade; use min/day/prevDay and todaysChangePerc per API docs.
 * @param {Record<string, unknown>} t
 */
export function rowFromSnapshotTicker(t) {
  const lastP = t.lastTrade?.p ?? t.lastQuote?.p ?? t.lastQuote?.P
  const p =
    typeof lastP === 'number'
      ? lastP
      : typeof t.min?.c === 'number'
        ? t.min.c
        : typeof t.day?.c === 'number'
          ? t.day.c
          : typeof t.prevDay?.c === 'number'
            ? t.prevDay.c
            : null

  const o =
    typeof t.day?.o === 'number'
      ? t.day.o
      : typeof t.prevDay?.o === 'number'
        ? t.prevDay.o
        : p

  let change_pct = null
  if (typeof t.todaysChangePerc === 'number' && !Number.isNaN(t.todaysChangePerc)) {
    change_pct = t.todaysChangePerc
  } else if (p != null && o != null && o !== 0) {
    change_pct = ((p - o) / o) * 100
  }

  const nsToIso = (ns) => {
    if (typeof ns !== 'number' || !Number.isFinite(ns)) return null
    const ms = ns > 1e14 ? Math.floor(ns / 1e6) : ns
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }

  let updated_at
  if (t.lastTrade?.t != null) {
    const iso = nsToIso(t.lastTrade.t)
    if (iso) {
      const tradeTime = new Date(iso)
      const tradeHour = tradeTime.getUTCHours() - 5
      if (tradeHour >= 9.5 && tradeHour <= 16) {
        updated_at = tradeTime.toISOString()
      } else {
        const marketClose = new Date(tradeTime)
        marketClose.setUTCHours(21, 0, 0, 0)
        updated_at = marketClose.toISOString()
      }
    }
  }
  if (!updated_at && t.updated != null) {
    updated_at = nsToIso(t.updated) ?? new Date().toISOString()
  }
  if (!updated_at) {
    updated_at = new Date().toISOString()
  }

  return { symbol: t.ticker, price: p, change_pct, updated_at }
}
