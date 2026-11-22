#!/usr/bin/env bash
# Regenerate index.html (professional view), universe/index.html, sitemap.xml
# and robots.txt from src/data. This is the only way those files are written.
# Edit SITE in qa/gen-head.ts first if the deploy domain changes.
set -euo pipefail
cd "$(dirname "$0")/.."
npx tsx qa/gen-head.ts > /tmp/head.json
python3 qa/write-head.py
echo "index.html, universe/index.html, sitemap.xml, robots.txt regenerated"
