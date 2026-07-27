-- normalize_state_name() is called once per row in state_price_stats' raw_prices
-- CTE (~1.3M times for a 365-day lookback across kroger+target+erewhon). Migration
-- 010 added `SET search_path = public, pg_temp` to it as part of a blanket fix for
-- the search_path-mutable security advisory. But a SET clause on a function
-- disables Postgres's planner-level inlining for that function - it forces a real
-- per-call function invocation (with GUC push/pop overhead) instead of the CASE
-- expression being inlined directly into the caller's plan for free.
--
-- normalize_state_name never references any table, sequence, or type - only the
-- built-in upper()/trim() - so it was never actually exposed to the
-- search-path-hijacking risk the SET clause defends against (that risk is about
-- unqualified references to schema objects an attacker could shadow). Removing
-- the SET clause here is safe and re-enables inlining.
--
-- Verified via EXPLAIN ANALYZE on the kroger/regular branch alone: 12,383ms ->
-- 1,104ms (11x) with this change, function body unchanged otherwise.
CREATE OR REPLACE FUNCTION normalize_state_name(raw text)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $function$
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
$function$;
