-- Consolidation pass:
--   1. kroger_stores_1500 duplicated full store rows (name/address/geom/etc)
--      for a set that's a 100% subset of kroger_stores - the only thing
--      that actually gets read from it (fetch-kroger-egg-prices.js) is
--      location_id. Replace it with a slim ID-only tracking table.
--   2. kroger_egg_prices_new's "_new" suffix no longer means anything -
--      rename to kroger_egg_prices.
--   3. target_egg_price_stats renamed to target_egg_prices, matching the
--      <brand>_egg_prices convention used by kroger/erewhon.

-- --- 1. Slim tracking table for the 1500 stores the scraper actually visits ---
CREATE TABLE IF NOT EXISTS kroger_tracked_stores (
    location_id TEXT PRIMARY KEY REFERENCES kroger_stores(location_id),
    added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE kroger_tracked_stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON kroger_tracked_stores;
CREATE POLICY "Public read access" ON kroger_tracked_stores FOR SELECT USING (true);

INSERT INTO kroger_tracked_stores (location_id)
SELECT location_id FROM kroger_stores_1500
ON CONFLICT (location_id) DO NOTHING;

-- --- 2 & 3. Renames ---
ALTER TABLE kroger_egg_prices_new RENAME TO kroger_egg_prices;
ALTER TABLE target_egg_price_stats RENAME TO target_egg_prices;

-- --- Re-point state_price_stats / stores_by_state at the renamed tables,
--     and at kroger_stores directly (not the old 1500-row duplicate) for
--     Kroger state/zip lookups. ---
CREATE OR REPLACE FUNCTION state_price_stats(lookback_days int DEFAULT 30)
RETURNS TABLE (
    state              text,
    store_count        bigint,
    sample_zip         text,
    avg_regular        numeric,
    avg_organic        numeric,
    volatility_regular numeric,
    volatility_organic numeric
) AS $$
    WITH raw_prices AS (
        SELECT normalize_state_name(ks.state) AS state, k.captured_date, 'regular'::text AS product_type, k.regular_min AS price
            FROM kroger_egg_prices k
            JOIN kroger_stores ks ON k.location_id = ks.location_id
            WHERE k.captured_date >= CURRENT_DATE - lookback_days AND k.regular_min IS NOT NULL AND ks.state IS NOT NULL
        UNION ALL
        SELECT normalize_state_name(ks.state), k.captured_date, 'organic', k.organic_min
            FROM kroger_egg_prices k
            JOIN kroger_stores ks ON k.location_id = ks.location_id
            WHERE k.captured_date >= CURRENT_DATE - lookback_days AND k.organic_min IS NOT NULL AND ks.state IS NOT NULL
        UNION ALL
        SELECT normalize_state_name(ts.state), t.captured_date, t.product_type, t.min_price
            FROM target_egg_prices t
            JOIN target_stores ts ON t.store_id = ts.store_id
            WHERE t.captured_date >= CURRENT_DATE - lookback_days AND t.min_price IS NOT NULL AND ts.state IS NOT NULL
        UNION ALL
        SELECT normalize_state_name(es.state), e.captured_date, 'regular', e.regular_min
            FROM erewhon_egg_prices e
            JOIN erewhon_stores es ON e.location_id = es.location_id
            WHERE e.captured_date >= CURRENT_DATE - lookback_days AND e.regular_min IS NOT NULL AND es.state IS NOT NULL
        UNION ALL
        SELECT normalize_state_name(es.state), e.captured_date, 'organic', e.organic_min
            FROM erewhon_egg_prices e
            JOIN erewhon_stores es ON e.location_id = es.location_id
            WHERE e.captured_date >= CURRENT_DATE - lookback_days AND e.organic_min IS NOT NULL AND es.state IS NOT NULL
    ),
    daily_state_avg AS (
        SELECT state, captured_date, product_type, AVG(price) AS avg_price
        FROM raw_prices
        GROUP BY state, captured_date, product_type
    ),
    state_agg AS (
        SELECT
            state,
            MAX(captured_date) FILTER (WHERE product_type = 'regular') AS latest_regular_date,
            MAX(captured_date) FILTER (WHERE product_type = 'organic') AS latest_organic_date,
            AVG(avg_price) FILTER (WHERE product_type = 'regular') AS avg_regular_raw,
            AVG(avg_price) FILTER (WHERE product_type = 'organic') AS avg_organic_raw,
            STDDEV(avg_price) FILTER (WHERE product_type = 'regular') AS volatility_regular_raw,
            STDDEV(avg_price) FILTER (WHERE product_type = 'organic') AS volatility_organic_raw
        FROM daily_state_avg
        GROUP BY state
    ),
    all_stores AS (
        SELECT normalize_state_name(state) AS state, zip FROM kroger_stores WHERE state IS NOT NULL
        UNION ALL
        SELECT normalize_state_name(state), zip FROM target_stores WHERE state IS NOT NULL
        UNION ALL
        SELECT normalize_state_name(state), zip FROM erewhon_stores WHERE state IS NOT NULL
    ),
    zip3_mode AS (
        SELECT state, mode() WITHIN GROUP (ORDER BY left(zip, 3)) AS common_zip3
        FROM all_stores
        WHERE zip IS NOT NULL AND length(zip) >= 3
        GROUP BY state
    ),
    store_counts AS (
        SELECT a.state, COUNT(*) AS store_count,
               MIN(a.zip) FILTER (WHERE left(a.zip, 3) = zm.common_zip3) AS sample_zip
        FROM all_stores a
        LEFT JOIN zip3_mode zm ON zm.state = a.state
        GROUP BY a.state
    )
    SELECT sc.state, sc.store_count, sc.sample_zip,
           CASE WHEN sa.latest_regular_date >= CURRENT_DATE - 1 THEN sa.avg_regular_raw ELSE NULL END AS avg_regular,
           CASE WHEN sa.latest_organic_date >= CURRENT_DATE - 1 THEN sa.avg_organic_raw ELSE NULL END AS avg_organic,
           CASE WHEN sa.latest_regular_date >= CURRENT_DATE - 1 THEN sa.volatility_regular_raw ELSE NULL END AS volatility_regular,
           CASE WHEN sa.latest_organic_date >= CURRENT_DATE - 1 THEN sa.volatility_organic_raw ELSE NULL END AS volatility_organic
    FROM store_counts sc
    LEFT JOIN state_agg sa ON sa.state = sc.state
    WHERE length(sc.state) = 2
    ORDER BY sc.state;
$$ LANGUAGE sql STABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION stores_by_state(state_in text, lookback_days int DEFAULT 30)
RETURNS TABLE (
    store_id           text,
    brand              text,
    name               text,
    address            text,
    city               text,
    state              text,
    zip                text,
    latitude           double precision,
    longitude          double precision,
    regular_price      numeric,
    regular_price_date date,
    organic_price      numeric,
    organic_price_date date
) AS $$
    WITH kroger_latest AS (
        SELECT DISTINCT ON (k.location_id)
            k.location_id, k.regular_min, k.organic_min, k.captured_date
        FROM kroger_egg_prices k
        WHERE k.captured_date >= CURRENT_DATE - lookback_days
        ORDER BY k.location_id, k.captured_date DESC
    ),
    kroger AS (
        SELECT
            ks.location_id AS store_id, 'Kroger/Affiliate'::text AS brand, ks.name,
            ks.address1 AS address, ks.city, ks.state, ks.zip,
            ks.latitude::double precision, ks.longitude::double precision,
            kl.regular_min AS regular_price, kl.captured_date AS regular_price_date,
            kl.organic_min AS organic_price, kl.captured_date AS organic_price_date
        FROM kroger_stores ks
        LEFT JOIN kroger_latest kl ON kl.location_id = ks.location_id
        WHERE normalize_state_name(ks.state) = state_in
    ),
    target_reg AS (
        SELECT DISTINCT ON (store_id) store_id, min_price AS regular_price, captured_date AS regular_price_date
        FROM target_egg_prices
        WHERE product_type = 'regular' AND min_price IS NOT NULL AND captured_date >= CURRENT_DATE - lookback_days
        ORDER BY store_id, captured_date DESC
    ),
    target_org AS (
        SELECT DISTINCT ON (store_id) store_id, min_price AS organic_price, captured_date AS organic_price_date
        FROM target_egg_prices
        WHERE product_type = 'organic' AND min_price IS NOT NULL AND captured_date >= CURRENT_DATE - lookback_days
        ORDER BY store_id, captured_date DESC
    ),
    target AS (
        SELECT
            ts.store_id, 'Target'::text AS brand, ts.name,
            ts.address1 AS address, ts.city, ts.state, ts.zip,
            ts.latitude, ts.longitude,
            tr.regular_price, tr.regular_price_date,
            torg.organic_price, torg.organic_price_date
        FROM target_stores ts
        LEFT JOIN target_reg tr ON tr.store_id = ts.store_id
        LEFT JOIN target_org torg ON torg.store_id = ts.store_id
        WHERE normalize_state_name(ts.state) = state_in
    ),
    erewhon_latest AS (
        SELECT DISTINCT ON (e.location_id)
            e.location_id, e.regular_min, e.organic_min, e.captured_date
        FROM erewhon_egg_prices e
        WHERE e.captured_date >= CURRENT_DATE - lookback_days
        ORDER BY e.location_id, e.captured_date DESC
    ),
    erewhon AS (
        SELECT
            es.location_id AS store_id, 'Erewhon'::text AS brand, es.name,
            es.address1 AS address, es.city, es.state, es.zip,
            es.latitude::double precision, es.longitude::double precision,
            el.regular_min AS regular_price, el.captured_date AS regular_price_date,
            el.organic_min AS organic_price, el.captured_date AS organic_price_date
        FROM erewhon_stores es
        LEFT JOIN erewhon_latest el ON el.location_id = es.location_id
        WHERE normalize_state_name(es.state) = state_in
    )
    SELECT * FROM kroger
    UNION ALL
    SELECT * FROM target
    UNION ALL
    SELECT * FROM erewhon;
$$ LANGUAGE sql STABLE SET search_path = public, pg_temp;

-- Old duplicate table, now fully replaced by kroger_tracked_stores above.
DROP TABLE IF EXISTS kroger_stores_1500;
