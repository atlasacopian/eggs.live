-- Full store list for a state (used by the /state/[state] page reached by
-- clicking a row in "Explore by State" on the National view) - every store
-- in the state with its latest price, not just stores within some radius of
-- a single zip. Kroger/Erewhon keep regular+organic on one row per capture,
-- so the single latest row per store has both; Target logs regular/organic
-- as separate rows (product_type), so those need independent latest lookups.
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
        FROM kroger_egg_prices_new k
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
        FROM kroger_stores_1500 ks
        LEFT JOIN kroger_latest kl ON kl.location_id = ks.location_id
        WHERE normalize_state_name(ks.state) = state_in
    ),
    target_reg AS (
        SELECT DISTINCT ON (store_id) store_id, min_price AS regular_price, captured_date AS regular_price_date
        FROM target_egg_price_stats
        WHERE product_type = 'regular' AND min_price IS NOT NULL AND captured_date >= CURRENT_DATE - lookback_days
        ORDER BY store_id, captured_date DESC
    ),
    target_org AS (
        SELECT DISTINCT ON (store_id) store_id, min_price AS organic_price, captured_date AS organic_price_date
        FROM target_egg_price_stats
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
$$ LANGUAGE sql STABLE;
