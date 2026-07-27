-- Reshapes target_egg_prices from "one row per store per day per product
-- type" into "one row per store per day, regular and organic as columns" -
-- matching kroger_egg_prices/erewhon_egg_prices exactly. Verified beforehand:
-- every (location_id, captured_date) pair has exactly 2 rows (regular +
-- organic), so this pivot is lossless.
--
-- The old table never tracked a per-row status the way Kroger/Erewhon do
-- (OUT_OF_STOCK, NO_DATA_FOUND, etc.) - it only ever recorded null prices
-- when nothing was found. status is inferred here as 'OK' when at least one
-- price was found that day, 'NO_DATA_FOUND' otherwise - an honest read of
-- what the old data actually distinguished, not a finer-grained status the
-- source data never captured.
--
-- Old table kept as target_egg_prices_longformat_backup - not dropped, in
-- case anything here needs re-checking later.
ALTER TABLE target_egg_prices RENAME TO target_egg_prices_longformat_backup;

CREATE TABLE target_egg_prices (
    id             SERIAL PRIMARY KEY,
    location_id    TEXT NOT NULL REFERENCES target_stores(location_id),
    captured_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    captured_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    regular_min    NUMERIC,
    regular_avg    NUMERIC,
    regular_max    NUMERIC,
    organic_min    NUMERIC,
    organic_avg    NUMERIC,
    organic_max    NUMERIC,
    status         TEXT,
    UNIQUE (location_id, captured_date)
);

CREATE INDEX idx_target_egg_prices_captured_date ON target_egg_prices (captured_date);

INSERT INTO target_egg_prices (location_id, captured_at, captured_date, regular_min, regular_avg, regular_max, organic_min, organic_avg, organic_max, status)
SELECT
    location_id,
    MAX(captured_at) AS captured_at,
    captured_date,
    MAX(min_price) FILTER (WHERE product_type = 'regular') AS regular_min,
    MAX(avg_price) FILTER (WHERE product_type = 'regular') AS regular_avg,
    MAX(max_price) FILTER (WHERE product_type = 'regular') AS regular_max,
    MAX(min_price) FILTER (WHERE product_type = 'organic') AS organic_min,
    MAX(avg_price) FILTER (WHERE product_type = 'organic') AS organic_avg,
    MAX(max_price) FILTER (WHERE product_type = 'organic') AS organic_max,
    CASE
        WHEN MAX(min_price) FILTER (WHERE product_type = 'regular') IS NOT NULL
          OR MAX(min_price) FILTER (WHERE product_type = 'organic') IS NOT NULL
        THEN 'OK' ELSE 'NO_DATA_FOUND'
    END AS status
FROM target_egg_prices_longformat_backup
GROUP BY location_id, captured_date;

ALTER TABLE target_egg_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON target_egg_prices FOR SELECT USING (true);
