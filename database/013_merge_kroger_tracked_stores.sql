-- Replaces the separate kroger_tracked_stores join table with a single
-- nullable column on kroger_stores itself - matches the simpler 2-table
-- pattern target_stores/erewhon_stores already use. tracked_since IS NOT
-- NULL means "the daily price scraper visits this store"; NULL means it
-- doesn't. Keeps the "when was this added to tracking" info that the old
-- join table's added_at column held, just on the store row directly.
ALTER TABLE kroger_stores ADD COLUMN IF NOT EXISTS tracked_since TIMESTAMPTZ;

UPDATE kroger_stores ks
SET tracked_since = kts.added_at
FROM kroger_tracked_stores kts
WHERE ks.location_id = kts.location_id;

CREATE INDEX IF NOT EXISTS idx_kroger_stores_tracked_since ON kroger_stores (tracked_since) WHERE tracked_since IS NOT NULL;

DROP TABLE kroger_tracked_stores;
