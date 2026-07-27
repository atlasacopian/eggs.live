-- Reclaims ~118MB of pure waste on a Free-tier project sitting at 490/500MB.
-- Both tables had two indexes covering the exact same columns - one from an
-- explicit UNIQUE CONSTRAINT, one already covered by the PRIMARY KEY (or a
-- second identical UNIQUE CONSTRAINT). Every upsert() in scripts/ specifies
-- onConflict by column list, not constraint name, so as long as ONE
-- matching unique index remains, nothing about the data pipeline changes.
ALTER TABLE target_egg_price_stats DROP CONSTRAINT unique_store_product_date;
ALTER TABLE kroger_egg_prices_new DROP CONSTRAINT kroger_egg_prices_new_unique_location_date;
