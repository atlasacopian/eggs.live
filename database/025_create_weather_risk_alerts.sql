-- Weather Risk module - active NWS alerts that could plausibly disrupt U.S.
-- egg production or transportation. Tracks all 50 states; is_major_producer
-- flags the 28 states USDA NASS individually discloses in the Chickens and
-- Eggs monthly report (see database/023/024's egg-data pipelines) - that
-- list is the objective ceiling of USDA's state-level disclosure, not a
-- subjective pick.
--
-- id is NWS's own stable alert URN (e.g. "urn:oid:2.49.0.1.840...") - using
-- it directly as the primary key makes de-duplication free (upsert on
-- conflict) instead of needing our own dedup logic.
CREATE TABLE weather_risk_alerts (
    id                 TEXT PRIMARY KEY,
    state              TEXT NOT NULL,
    event_type         TEXT NOT NULL,
    category           TEXT NOT NULL CHECK (category IN (
                           'extreme_heat', 'extreme_cold', 'winter_storm',
                           'flooding', 'hurricane', 'severe_thunderstorm', 'tornado'
                       )),
    severity           TEXT NOT NULL,
    headline           TEXT,
    source_url         TEXT,
    effective_at       TIMESTAMPTZ,
    expires_at         TIMESTAMPTZ,
    is_major_producer  BOOLEAN NOT NULL DEFAULT false,
    fetched_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_weather_risk_alerts_expires_at ON weather_risk_alerts (expires_at);
CREATE INDEX idx_weather_risk_alerts_state ON weather_risk_alerts (state);

ALTER TABLE weather_risk_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON weather_risk_alerts FOR SELECT USING (true);
