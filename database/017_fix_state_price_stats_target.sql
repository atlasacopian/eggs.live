-- state_price_stats still referenced target_egg_prices's old long-format
-- columns (product_type, min_price, store_id) which no longer exist after
-- database/014 (column rename) and database/015 (wide-format reshape).
-- Target's regular/organic rows now come from columns, exactly like
-- kroger/erewhon - same UNION ALL pattern as those two.
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
