-- state_price_stats() (database/005) filters each price table by
-- captured_date across every store nationwide, but the existing indexes are
-- all (store_id, captured_date) composites - useless for a broad "all
-- stores, recent dates" scan since captured_date isn't the leading column.
-- That made the widened 365-day lookback (needed once Target's scraper
-- outage made 30 days too thin - see app/api/state-price-stats/route.js)
-- exceed Supabase's statement timeout on a cold cache. A plain index on
-- captured_date lets Postgres seek straight to the relevant date range.
-- CONCURRENTLY avoids taking a lock that would block the live scraper jobs
-- writing to these tables while the index builds.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kroger_egg_prices_new_captured_date
    ON kroger_egg_prices_new (captured_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_target_egg_price_stats_captured_date
    ON target_egg_price_stats (captured_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_erewhon_egg_prices_captured_date
    ON erewhon_egg_prices (captured_date);
