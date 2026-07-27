-- State-level price rankings for the National view's "Explore by State" panel.
-- Kroger and Erewhon already store `state` as a clean 2-letter code, but
-- target_stores mixes full names ("California") and codes ("CA") for the
-- same state interchangeably - normalize_state_name() reconciles that so a
-- state isn't split into two rows in the rankings.

CREATE OR REPLACE FUNCTION normalize_state_name(raw text)
RETURNS text AS $$
    SELECT CASE upper(trim(raw))
        WHEN 'ALABAMA' THEN 'AL' WHEN 'ALASKA' THEN 'AK' WHEN 'ARIZONA' THEN 'AZ'
        WHEN 'ARKANSAS' THEN 'AR' WHEN 'CALIFORNIA' THEN 'CA' WHEN 'COLORADO' THEN 'CO'
        WHEN 'CONNECTICUT' THEN 'CT' WHEN 'DELAWARE' THEN 'DE' WHEN 'DISTRICT OF COLUMBIA' THEN 'DC'
        WHEN 'FLORIDA' THEN 'FL' WHEN 'GEORGIA' THEN 'GA' WHEN 'HAWAII' THEN 'HI'
        WHEN 'IDAHO' THEN 'ID' WHEN 'ILLINOIS' THEN 'IL' WHEN 'INDIANA' THEN 'IN'
        WHEN 'IOWA' THEN 'IA' WHEN 'KANSAS' THEN 'KS' WHEN 'KENTUCKY' THEN 'KY'
        WHEN 'LOUISIANA' THEN 'LA' WHEN 'MAINE' THEN 'ME' WHEN 'MARYLAND' THEN 'MD'
        WHEN 'MASSACHUSETTS' THEN 'MA' WHEN 'MICHIGAN' THEN 'MI' WHEN 'MINNESOTA' THEN 'MN'
        WHEN 'MISSISSIPPI' THEN 'MS' WHEN 'MISSOURI' THEN 'MO' WHEN 'MONTANA' THEN 'MT'
        WHEN 'NEBRASKA' THEN 'NE' WHEN 'NEVADA' THEN 'NV' WHEN 'NEW HAMPSHIRE' THEN 'NH'
        WHEN 'NEW JERSEY' THEN 'NJ' WHEN 'NEW MEXICO' THEN 'NM' WHEN 'NEW YORK' THEN 'NY'
        WHEN 'NORTH CAROLINA' THEN 'NC' WHEN 'NORTH DAKOTA' THEN 'ND' WHEN 'OHIO' THEN 'OH'
        WHEN 'OKLAHOMA' THEN 'OK' WHEN 'OREGON' THEN 'OR' WHEN 'PENNSYLVANIA' THEN 'PA'
        WHEN 'RHODE ISLAND' THEN 'RI' WHEN 'SOUTH CAROLINA' THEN 'SC' WHEN 'SOUTH DAKOTA' THEN 'SD'
        WHEN 'TENNESSEE' THEN 'TN' WHEN 'TEXAS' THEN 'TX' WHEN 'UTAH' THEN 'UT'
        WHEN 'VERMONT' THEN 'VT' WHEN 'VIRGINIA' THEN 'VA' WHEN 'WASHINGTON' THEN 'WA'
        WHEN 'WEST VIRGINIA' THEN 'WV' WHEN 'WISCONSIN' THEN 'WI' WHEN 'WYOMING' THEN 'WY'
        WHEN 'PUERTO RICO' THEN 'PR'
        ELSE upper(trim(raw))
    END;
$$ LANGUAGE sql IMMUTABLE;

-- Per-state avg price + volatility over the trailing `lookback_days`.
-- "Volatility" = stddev of the state's own daily cross-store average price,
-- i.e. how much the state's egg price bounces around day to day - not
-- cross-store spread within a single day, which would just measure store mix.
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
            FROM kroger_egg_prices_new k
            JOIN kroger_stores_1500 ks ON k.location_id = ks.location_id
            WHERE k.captured_date >= CURRENT_DATE - lookback_days AND k.regular_min IS NOT NULL AND ks.state IS NOT NULL
        UNION ALL
        SELECT normalize_state_name(ks.state), k.captured_date, 'organic', k.organic_min
            FROM kroger_egg_prices_new k
            JOIN kroger_stores_1500 ks ON k.location_id = ks.location_id
            WHERE k.captured_date >= CURRENT_DATE - lookback_days AND k.organic_min IS NOT NULL AND ks.state IS NOT NULL
        UNION ALL
        SELECT normalize_state_name(ts.state), t.captured_date, t.product_type, t.min_price
            FROM target_egg_price_stats t
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
    -- A long lookback keeps the average stable, but a state whose most
    -- recent capture is more than a day or two old (Target's own scraper
    -- has been down ~2 months in plenty of states) isn't showing today's
    -- price at all - that's stale, not current, and gets nulled out below
    -- rather than presented as if it were accurate right now.
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
        SELECT normalize_state_name(state) AS state, zip FROM kroger_stores_1500 WHERE state IS NOT NULL
        UNION ALL
        SELECT normalize_state_name(state), zip FROM target_stores WHERE state IS NOT NULL
        UNION ALL
        SELECT normalize_state_name(state), zip FROM erewhon_stores WHERE state IS NOT NULL
    ),
    -- A handful of source rows have a flatly wrong state label (e.g. one
    -- Target store in Crystal, MN mistagged state='California'), which would
    -- poison a plain MIN(zip) pick. Anchor on each state's most common 3-digit
    -- zip prefix first so one mislabeled outlier can't hijack the sample zip.
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
$$ LANGUAGE sql STABLE;
