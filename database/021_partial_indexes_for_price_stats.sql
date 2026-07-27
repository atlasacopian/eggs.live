-- state_price_stats' raw_prices CTE scans target_egg_prices/kroger_egg_prices by
-- captured_date, then filters out rows where regular_min/organic_min is null.
-- For target_egg_prices specifically, ~95% of rows in the last 365 days are
-- null (Target's scraper outage - see app/api/state-price-stats/route.js) so
-- the plain captured_date index makes Postgres fetch ~721K rows from the heap
-- just to throw away ~688K of them, every time, for both the regular and
-- organic branches (~1.17M wasted buffer hits out of ~1.19M total).
--
-- Partial indexes that already exclude null-price rows let the planner skip
-- that waste entirely. Verified via EXPLAIN ANALYZE before creating these.
CREATE INDEX idx_target_egg_prices_date_regular ON target_egg_prices (captured_date) WHERE regular_min IS NOT NULL;
CREATE INDEX idx_target_egg_prices_date_organic ON target_egg_prices (captured_date) WHERE organic_min IS NOT NULL;
CREATE INDEX idx_kroger_egg_prices_date_regular ON kroger_egg_prices (captured_date) WHERE regular_min IS NOT NULL;
CREATE INDEX idx_kroger_egg_prices_date_organic ON kroger_egg_prices (captured_date) WHERE organic_min IS NOT NULL;
