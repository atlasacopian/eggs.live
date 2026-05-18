#!/usr/bin/env bash
# Usage: ci-require-env.sh VAR1 VAR2 ...
set -euo pipefail
missing=0
for var in "$@"; do
  if [ -z "${!var:-}" ]; then
    echo "::error::Missing required secret/env: $var"
    missing=1
  fi
done
if [ "$missing" -ne 0 ]; then
  exit 1
fi
echo "✅ Required env vars present: $*"
