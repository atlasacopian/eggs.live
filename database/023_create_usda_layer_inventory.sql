-- USDA NASS "Chickens and Eggs" monthly report - table-egg layer inventory
-- (commodity_desc=CHICKENS, class_desc="LAYERS, TABLE", statisticcat_desc=
-- INVENTORY, agg_level_desc=NATIONAL via the Quick Stats API). Deliberately
-- excludes hatching-egg-type layers (broiler-type and egg-type breeders),
-- which the API reports as separate class_desc values.
--
-- One row per reference month (point-in-time "first of month" head count).
-- usda_load_time is USDA's own publish/revision timestamp for that data
-- point - the fetch script upserts on reference_date, so a later USDA
-- revision to an already-stored month just overwrites it and updates this
-- column, rather than silently going stale.
CREATE TABLE usda_layer_inventory (
    id                     SERIAL PRIMARY KEY,
    reference_date         DATE NOT NULL UNIQUE,
    inventory_head         BIGINT NOT NULL,
    reference_period_desc  TEXT,
    usda_load_time          TIMESTAMPTZ,
    fetched_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usda_layer_inventory_reference_date ON usda_layer_inventory (reference_date DESC);

ALTER TABLE usda_layer_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON usda_layer_inventory FOR SELECT USING (true);
