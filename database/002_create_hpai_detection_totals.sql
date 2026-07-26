-- Server-side aggregate for the HPAI national-view block. Computing these
-- sums client-side via supabase-js is unreliable because PostgREST caps
-- unpaginated selects at 1000 rows by default, silently undercounting a
-- 2,000+ row table.
CREATE OR REPLACE FUNCTION hpai_detection_totals()
RETURNS TABLE (
    total_flocks          BIGINT,
    commercial_flocks     BIGINT,
    backyard_flocks       BIGINT,
    total_birds_affected  BIGINT,
    active_flocks         BIGINT
) AS $$
    SELECT
        count(*),
        count(*) FILTER (WHERE flock_type = 'commercial'),
        count(*) FILTER (WHERE flock_type = 'backyard'),
        coalesce(sum(birds_affected), 0),
        count(*) FILTER (WHERE is_active)
    FROM hpai_detections;
$$ LANGUAGE sql STABLE;
