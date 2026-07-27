-- kroger_stores holds every known Kroger-family location (2,893), but only
-- the subset with tracked_since set (~1,500) is actually scraped for prices
-- (see database/013) - scraping all of them daily would cost far more in
-- GitHub Actions runner-minutes and Kroger-facing requests than the tracked
-- subset does. Every function that surfaces "stores" to the site needs to
-- filter on tracked_since, or it double-counts ~1,400 stores that have zero
-- price data and were never meant to be scraped.

CREATE OR REPLACE FUNCTION nearby_kroger_stores(lat_in double precision, lon_in double precision, radius_miles double precision)
RETURNS TABLE(store_id text, name text, address text, city text, state text, zip text, distance_miles double precision, latitude double precision, longitude double precision)
LANGUAGE sql STABLE PARALLEL SAFE
SET search_path TO 'public', 'pg_temp'
AS $function$
    SELECT
        ks.location_id AS store_id,
        ks.name,
        ks.address1 AS address,
        ks.city,
        ks.state,
        ks.zip,
        ST_Distance(
            ks.geom::geography,
            ST_SetSRID(ST_MakePoint(lon_in, lat_in), 4326)::geography
        ) / 1609.344 AS distance_miles,
        ks.latitude,
        ks.longitude
    FROM
        kroger_stores ks
    WHERE
        ks.tracked_since IS NOT NULL
        AND ST_DWithin(
            ks.geom::geography,
            ST_SetSRID(ST_MakePoint(lon_in, lat_in), 4326)::geography,
            radius_miles * 1609.344
        )
    ORDER BY
        distance_miles;
$function$;

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
        WHERE normalize_state_name(ks.state) = state_in AND ks.tracked_since IS NOT NULL
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
        SELECT normalize_state_name(ts.state), t.captured_date, 'regular', t.regular_min
            FROM target_egg_prices t
            JOIN target_stores ts ON t.location_id = ts.location_id
            WHERE t.captured_date >= CURRENT_DATE - lookback_days AND t.regular_min IS NOT NULL AND ts.state IS NOT NULL
        UNION ALL
        SELECT normalize_state_name(ts.state), t.captured_date, 'organic', t.organic_min
            FROM target_egg_prices t
            JOIN target_stores ts ON t.location_id = ts.location_id
            WHERE t.captured_date >= CURRENT_DATE - lookback_days AND t.organic_min IS NOT NULL AND ts.state IS NOT NULL
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
        SELECT normalize_state_name(state) AS state, zip FROM kroger_stores WHERE state IS NOT NULL AND tracked_since IS NOT NULL
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
