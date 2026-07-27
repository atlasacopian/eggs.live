-- User decided to scrape all known Kroger-family stores rather than just the
-- curated ~1,500 subset (see database/013/018) - GitHub Actions cost for the
-- extra ~1,400 stores is small (~$6-7/month) and worth it for real coverage.
-- Backfill tracked_since for every remaining untracked store so the daily
-- scraper (which filters WHERE tracked_since IS NOT NULL) picks them all up.
UPDATE kroger_stores SET tracked_since = now() WHERE tracked_since IS NULL;
