-- Enable PostGIS (no-op if it already exists)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------
-- 1. Kroger stores ------------------------------------------------
-- ------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kroger_stores' AND column_name = 'geom'
    ) THEN
        ALTER TABLE kroger_stores
            ADD COLUMN geom geometry(Point,4326)
            GENERATED ALWAYS AS (
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
            ) STORED;
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_kroger_stores_geom
    ON kroger_stores USING GIST (geom);


-- ------------------------------------------------------------
-- 2. Kroger trimmed subset ------------------------------------
-- ------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'kroger_stores_1500' AND column_name = 'geom'
    ) THEN
        ALTER TABLE kroger_stores_1500
            ADD COLUMN geom geometry(Point,4326)
            GENERATED ALWAYS AS (
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
            ) STORED;
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_kroger_stores_1500_geom
    ON kroger_stores_1500 USING GIST (geom);


-- ------------------------------------------------------------
-- 3. Target stores --------------------------------------------
-- ------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'target_stores' AND column_name = 'geom'
    ) THEN
        ALTER TABLE target_stores
            ADD COLUMN geom geometry(Point,4326)
            GENERATED ALWAYS AS (
                ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
            ) STORED;
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_target_stores_geom
    ON target_stores USING GIST (geom);

-- After running this migration, geometry_columns should list the three new geometry columns.
-- All future inserts/updates automatically populate `geom` via the generated column definition. 