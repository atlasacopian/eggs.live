-- Row-level HPAI (bird flu) flock detections, sourced directly from APHIS's
-- own public Tableau dashboard (publicdashboards.dl.usda.gov), which is kept
-- current daily. This supersedes the state-aggregate hpai_state_daily_stats
-- table, whose upstream CDC mirror stopped updating past mid-2025.

CREATE TABLE IF NOT EXISTS hpai_detections (
    id                     BIGSERIAL PRIMARY KEY,
    special_id             TEXT NOT NULL,
    county                 TEXT NOT NULL,
    state                  TEXT NOT NULL,
    production             TEXT NOT NULL,
    flock_type             TEXT NOT NULL CHECK (flock_type IN ('commercial', 'backyard')),
    confirmed_date         DATE NOT NULL,
    control_area_released  TEXT,
    is_active              BOOLEAN NOT NULL DEFAULT FALSE,
    birds_affected         INTEGER NOT NULL DEFAULT 0,
    captured_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (special_id, state, county, confirmed_date)
);

CREATE INDEX IF NOT EXISTS idx_hpai_detections_confirmed_date
    ON hpai_detections (confirmed_date DESC);

CREATE INDEX IF NOT EXISTS idx_hpai_detections_state
    ON hpai_detections (state);
