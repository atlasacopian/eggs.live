-- Kroger and Erewhon both use `location_id` as their store identifier
-- column, in both their stores AND prices tables. Target used `store_id`
-- instead - purely a naming inconsistency, same concept. This renames the
-- underlying columns to match; the nearby_target_stores RPC's external
-- output column stays named `store_id` (aliased below) since every JS
-- consumer already expects that name regardless of brand - only the raw
-- table-level naming changes.
ALTER TABLE target_stores RENAME COLUMN store_id TO location_id;
ALTER TABLE target_egg_prices RENAME COLUMN store_id TO location_id;

CREATE OR REPLACE FUNCTION public.nearby_target_stores(lat_in double precision, lon_in double precision, radius_miles integer DEFAULT 5)
RETURNS TABLE(store_id text, name text, address text, city text, state text, zip text, distance double precision)
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
    DECLARE
        radius_meters double precision;
        input_geog geography;
    BEGIN
        radius_meters := radius_miles * 1609.34;
        input_geog := ST_SetSRID(ST_MakePoint(lon_in, lat_in), 4326)::geography;

        RETURN QUERY
        SELECT
            ts.location_id AS store_id,
            ts.name,
            ts.address1 as address,
            ts.city,
            ts.state,
            ts.zip,
            ST_Distance(ts.geom::geography, input_geog) / 1609.34 AS distance
        FROM
            public.target_stores ts
        WHERE
            ST_DWithin(
                ts.geom::geography,
                input_geog,
                radius_meters
            )
        ORDER BY
            distance
        ;
    END;
    $function$;

-- stores_by_state (database/006/012): re-point the target CTEs at the
-- renamed location_id column, keeping its own output column named
-- store_id for the same reason.
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
        SELECT DISTINCT ON (location_id) location_id, min_price AS regular_price, captured_date AS regular_price_date
        FROM target_egg_prices
        WHERE product_type = 'regular' AND min_price IS NOT NULL AND captured_date >= CURRENT_DATE - lookback_days
        ORDER BY location_id, captured_date DESC
    ),
    target_org AS (
        SELECT DISTINCT ON (location_id) location_id, min_price AS organic_price, captured_date AS organic_price_date
        FROM target_egg_prices
        WHERE product_type = 'organic' AND min_price IS NOT NULL AND captured_date >= CURRENT_DATE - lookback_days
        ORDER BY location_id, captured_date DESC
    ),
    target AS (
        SELECT
            ts.location_id AS store_id, 'Target'::text AS brand, ts.name,
            ts.address1 AS address, ts.city, ts.state, ts.zip,
            ts.latitude, ts.longitude,
            tr.regular_price, tr.regular_price_date,
            torg.organic_price, torg.organic_price_date
        FROM target_stores ts
        LEFT JOIN target_reg tr ON tr.location_id = ts.location_id
        LEFT JOIN target_org torg ON torg.location_id = ts.location_id
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
