-- normalize_state_name(ks.state)/normalize_state_name(ts.state)/normalize_state_name(es.state)
-- was still being called once per PRICE ROW in state_price_stats/stores_by_state
-- (~890K times for kroger alone on a 365-day lookback), even though state only
-- varies per STORE (2,893 kroger stores). Precomputing it once as a generated
-- column on the small stores tables - instead of calling it per price row in the
-- big join - cuts ~890K function calls down to ~2,893.
ALTER TABLE kroger_stores  ADD COLUMN state_abbr TEXT GENERATED ALWAYS AS (normalize_state_name(state)) STORED;
ALTER TABLE target_stores  ADD COLUMN state_abbr TEXT GENERATED ALWAYS AS (normalize_state_name(state)) STORED;
ALTER TABLE erewhon_stores ADD COLUMN state_abbr TEXT GENERATED ALWAYS AS (normalize_state_name(state)) STORED;

CREATE INDEX idx_kroger_stores_state_abbr  ON kroger_stores (state_abbr);
CREATE INDEX idx_target_stores_state_abbr  ON target_stores (state_abbr);
CREATE INDEX idx_erewhon_stores_state_abbr ON erewhon_stores (state_abbr);

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
        SELECT ks.state_abbr AS state, k.captured_date, 'regular'::text AS product_type, k.regular_min AS price
            FROM kroger_egg_prices k
            JOIN kroger_stores ks ON k.location_id = ks.location_id
            WHERE k.captured_date >= CURRENT_DATE - lookback_days AND k.regular_min IS NOT NULL AND ks.state_abbr IS NOT NULL
        UNION ALL
        SELECT ks.state_abbr, k.captured_date, 'organic', k.organic_min
            FROM kroger_egg_prices k
            JOIN kroger_stores ks ON k.location_id = ks.location_id
            WHERE k.captured_date >= CURRENT_DATE - lookback_days AND k.organic_min IS NOT NULL AND ks.state_abbr IS NOT NULL
        UNION ALL
        SELECT ts.state_abbr, t.captured_date, 'regular', t.regular_min
            FROM target_egg_prices t
            JOIN target_stores ts ON t.location_id = ts.location_id
            WHERE t.captured_date >= CURRENT_DATE - lookback_days AND t.regular_min IS NOT NULL AND ts.state_abbr IS NOT NULL
        UNION ALL
        SELECT ts.state_abbr, t.captured_date, 'organic', t.organic_min
            FROM target_egg_prices t
            JOIN target_stores ts ON t.location_id = ts.location_id
            WHERE t.captured_date >= CURRENT_DATE - lookback_days AND t.organic_min IS NOT NULL AND ts.state_abbr IS NOT NULL
        UNION ALL
        SELECT es.state_abbr, e.captured_date, 'regular', e.regular_min
            FROM erewhon_egg_prices e
            JOIN erewhon_stores es ON e.location_id = es.location_id
            WHERE e.captured_date >= CURRENT_DATE - lookback_days AND e.regular_min IS NOT NULL AND es.state_abbr IS NOT NULL
        UNION ALL
        SELECT es.state_abbr, e.captured_date, 'organic', e.organic_min
            FROM erewhon_egg_prices e
            JOIN erewhon_stores es ON e.location_id = es.location_id
            WHERE e.captured_date >= CURRENT_DATE - lookback_days AND e.organic_min IS NOT NULL AND es.state_abbr IS NOT NULL
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
        SELECT state_abbr AS state, zip FROM kroger_stores WHERE state_abbr IS NOT NULL AND tracked_since IS NOT NULL
        UNION ALL
        SELECT state_abbr, zip FROM target_stores WHERE state_abbr IS NOT NULL
        UNION ALL
        SELECT state_abbr, zip FROM erewhon_stores WHERE state_abbr IS NOT NULL
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
        WHERE ks.state_abbr = state_in AND ks.tracked_since IS NOT NULL
    ),
    target_latest AS (
        SELECT DISTINCT ON (t.location_id)
            t.location_id, t.regular_min, t.organic_min, t.captured_date
        FROM target_egg_prices t
        WHERE t.captured_date >= CURRENT_DATE - lookback_days
        ORDER BY t.location_id, t.captured_date DESC
    ),
    target AS (
        SELECT
            ts.location_id AS store_id, 'Target'::text AS brand, ts.name,
            ts.address1 AS address, ts.city, ts.state, ts.zip,
            ts.latitude, ts.longitude,
            tl.regular_min AS regular_price, tl.captured_date AS regular_price_date,
            tl.organic_min AS organic_price, tl.captured_date AS organic_price_date
        FROM target_stores ts
        LEFT JOIN target_latest tl ON tl.location_id = ts.location_id
        WHERE ts.state_abbr = state_in
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
        WHERE es.state_abbr = state_in
    )
    SELECT * FROM kroger
    UNION ALL
    SELECT * FROM target
    UNION ALL
    SELECT * FROM erewhon;
$$ LANGUAGE sql STABLE SET search_path = public, pg_temp;
