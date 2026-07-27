-- Supabase Security Advisor: "Function Search Path Mutable" on all 11
-- functions below. Without an explicit search_path, a function resolves
-- unqualified names (tables, other functions) against whatever search_path
-- the calling session happens to have - which an attacker can manipulate
-- (e.g. by creating a same-named object in a schema earlier in their own
-- search_path) to hijack what the function actually executes, especially
-- risky for SECURITY DEFINER functions. Pinning search_path to `public,
-- pg_temp` closes that off; behavior is unchanged since these functions
-- only ever reference public-schema objects anyway.
ALTER FUNCTION public.get_la_egg_price_averages() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_stores_with_prices(zip_in text, lat_in numeric, lon_in numeric, radius_mi numeric) SET search_path = public, pg_temp;
ALTER FUNCTION public.trg_sync_zip() SET search_path = public, pg_temp;
ALTER FUNCTION public.hpai_detection_totals() SET search_path = public, pg_temp;
ALTER FUNCTION public.nearby_kroger_stores(lat_in double precision, lon_in double precision, radius_miles double precision) SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.nearby_target_stores(lat_in double precision, lon_in double precision, radius_miles integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.nearby_erewhon_stores(lat_in double precision, lon_in double precision, radius_miles double precision) SET search_path = public, pg_temp;
ALTER FUNCTION public.state_price_stats(lookback_days integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.stores_by_state(state_in text, lookback_days integer) SET search_path = public, pg_temp;
ALTER FUNCTION public.normalize_state_name(raw text) SET search_path = public, pg_temp;
