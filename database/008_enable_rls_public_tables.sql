-- Supabase's Security Advisor flags every public table without Row Level
-- Security as CRITICAL: the app's NEXT_PUBLIC_SUPABASE_ANON_KEY is bundled
-- into client-side JS (lib/supabase.js's supabaseBrowser()), so that key is
-- effectively public. Without RLS, anyone holding it could read AND write/
-- delete rows directly via Supabase's REST API, bypassing this app entirely.
--
-- All of this data is already publicly readable on the site itself, so a
-- public SELECT policy costs nothing - the actual fix is blocking writes.
-- Every real write path (the scraper scripts in scripts/) uses the
-- service-role key, which bypasses RLS regardless of these policies, so
-- the data pipeline is unaffected.
--
-- spatial_ref_sys is a PostGIS system table (not app data) and is
-- deliberately left alone - a standard, harmless flag on any project using
-- PostGIS.

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY[
        'target_stores',
        'kroger_egg_prices_new',
        'kroger_stores',
        'target_egg_price_stats',
        'la_stores',
        'usda_weekly_egg_prices',
        'la_egg_prices',
        'hpai_detections',
        'erewhon_stores',
        'erewhon_egg_prices',
        'zip_centroids',
        'kroger_stores_1500'
    ])
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public read access" ON %I', t);
        EXECUTE format('CREATE POLICY "Public read access" ON %I FOR SELECT USING (true)', t);
    END LOOP;
END $$;
