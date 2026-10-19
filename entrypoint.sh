#!/bin/bash
set -e

echo "=== Cobble ==="

cd /app

# bun-sqlite's record of the live schema sits beside the code; keep it on
# the data volume with the database it describes
mkdir -p "${DATA_DIR:-/data}/.bun-sqlite"
rm -rf /app/.bun-sqlite
ln -sfn "${DATA_DIR:-/data}/.bun-sqlite" /app/.bun-sqlite

bunx bun-sqlite schema -y
bunx bunext build
bunx bunext sitemap

echo "Starting server on port ${PORT:-7227}..."

bun src/server.ts
