#!/usr/bin/env bash
# One-shot: ensure workflows are enabled and fire a manual run on main.
# Prerequisite (once per machine):  gh auth login
set -euo pipefail
REPO="${GITHUB_REPO:-atlasacopian/eggs.live}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Install GitHub CLI: brew install gh"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  echo "Not logged in. In a terminal run:"
  echo "  gh auth login"
  echo "Then re-run:"
  echo "  bash scripts/trigger-github-workflows.sh"
  exit 1
fi

echo "=== Repository: $REPO ==="
echo ""
echo "=== Action secrets (names only — values hidden) ==="
gh secret list -R "$REPO" || true
echo ""
echo "=== Enabling workflows (no-op if already on) ==="
for w in \
  "HPAI State Fetcher" \
  "National Daily (USDA)" \
  "Target Egg Prices" \
  "Kroger Egg Prices" \
  "National Historical (FRED)"; do
  gh workflow enable "$w" -R "$REPO" 2>/dev/null && echo "  enabled: $w" || echo "  (skip or already on) $w"
done

echo ""
echo "=== Dispatching smoke runs on branch main ==="
for w in \
  "HPAI State Fetcher" \
  "National Daily (USDA)" \
  "Target Egg Prices" \
  "Kroger Egg Prices" \
  "National Historical (FRED)"; do
  echo "  dispatch: $w"
  gh workflow run "$w" -R "$REPO" --ref main
done

echo ""
echo "Done. Open: https://github.com/$REPO/actions"
