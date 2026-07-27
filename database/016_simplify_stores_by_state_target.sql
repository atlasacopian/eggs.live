-- Now that target_egg_prices matches kroger_egg_prices/erewhon_egg_prices's
-- shape (one row per store per day, regular/organic as columns), the target
-- CTEs collapse to the exact same single-DISTINCT-ON pattern as kroger -
-- the separate target_reg/target_org pivot CTEs from database/006/014 are
-- no longer needed at all.
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
