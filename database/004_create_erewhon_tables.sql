-- Erewhon: a 15-location Southern California premium grocer, priced directly
-- from their own storefront (Algolia search index, one per store - product
-- data, not a delivery-marketplace markup). Verified against 5 geographically
-- spread locations that egg prices are identical chain-wide; still stored
-- per-store (not one shared row) so each physical location can appear in the
-- local store list like Kroger/Target, and in case pricing ever does diverge
-- by location in the future.

CREATE TABLE IF NOT EXISTS erewhon_stores (
    location_id TEXT PRIMARY KEY,       -- Algolia search_index code, e.g. 'GROVE', 'CBS'
    name        TEXT NOT NULL,
    address1    TEXT,
    city        TEXT,
    state       TEXT,
    zip         TEXT,
    phone       TEXT,
    latitude    NUMERIC,
    longitude   NUMERIC,
    last_seen   TIMESTAMPTZ DEFAULT now(),
    geom        GEOMETRY(Point, 4326) GENERATED ALWAYS AS (
                    ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)
                ) STORED
);

CREATE INDEX IF NOT EXISTS idx_erewhon_stores_geom ON erewhon_stores USING GIST (geom);

CREATE TABLE IF NOT EXISTS erewhon_egg_prices (
    id             SERIAL PRIMARY KEY,
    location_id    TEXT NOT NULL REFERENCES erewhon_stores(location_id),
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

CREATE OR REPLACE FUNCTION nearby_erewhon_stores(lat_in double precision, lon_in double precision, radius_miles double precision)
RETURNS TABLE(store_id text, name text, address text, city text, state text, zip text, distance_miles double precision, latitude double precision, longitude double precision)
LANGUAGE sql STABLE PARALLEL SAFE
AS $function$
    SELECT
        es.location_id AS store_id,
        es.name,
        es.address1 AS address,
        es.city,
        es.state,
        es.zip,
        ST_Distance(
            es.geom::geography,
            ST_SetSRID(ST_MakePoint(lon_in, lat_in), 4326)::geography
        ) / 1609.344 AS distance_miles,
        es.latitude,
        es.longitude
    FROM erewhon_stores es
    WHERE ST_DWithin(
        es.geom::geography,
        ST_SetSRID(ST_MakePoint(lon_in, lat_in), 4326)::geography,
        radius_miles * 1609.344
    )
    ORDER BY distance_miles;
$function$;
