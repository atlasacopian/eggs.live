-- Feed Commodities module - tracks the two primary inputs to U.S. layer feed
-- as independent series (no blended/weighted index):
--   corn          - USDA NASS Quick Stats: "CORN, GRAIN - PRICE RECEIVED",
--                   $/bushel, national, monthly. Corn is the dominant
--                   ingredient in layer feed by weight.
--   soybean_meal  - FRED series WPU029201 (BLS Producer Price Index:
--                   "Processed Foods and Feeds: Soybean Cake, Meal, and
--                   Byproducts"). NASS's own soybean meal "price paid" series
--                   was discontinued in 2014 (same cut that killed the
--                   layer-feed-complete series) and no live national USDA/AMS
--                   soybean meal series exists, so this is the best current
--                   official U.S. government series - an index (not a $
--                   price), tracked here for its own relative change like
--                   usda_layer_inventory already is.
--
-- One row per commodity per reference month. unit/source/source_series_id
-- are stored per-row (not hardcoded in application code) so the two
-- structurally different sources (NASS vs FRED) can be told apart and
-- displayed correctly without the API needing commodity-specific branching
-- beyond which table column to read.
CREATE TABLE feed_commodity_prices (
    id                 SERIAL PRIMARY KEY,
    commodity          TEXT NOT NULL CHECK (commodity IN ('corn', 'soybean_meal')),
    reference_date     DATE NOT NULL,
    value              NUMERIC NOT NULL,
    unit               TEXT NOT NULL,
    source             TEXT NOT NULL,
    source_series_id   TEXT,
    source_load_time   TIMESTAMPTZ,
    fetched_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (commodity, reference_date)
);

CREATE INDEX idx_feed_commodity_prices_commodity_date ON feed_commodity_prices (commodity, reference_date DESC);

ALTER TABLE feed_commodity_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON feed_commodity_prices FOR SELECT USING (true);
