#!/bin/sh
# Rebuild everything in order. StatsBomb raw data is only needed when sb/select.txt changes:
#   python3 data-src/sb_extract.py <statsbomb open-data/data folder>
set -e
cd "$(dirname "$0")"
python3 build.py >/dev/null          # base build (resolvers read www/js/data.js)
python3 sb_resolve.py && python3 sb_apply.py
python3 gen_apply.py
python3 build.py
