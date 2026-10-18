#!/bin/bash
set -e

echo "=== Bunext SQLite Template ==="

cd /app

bunx bun-sqlite schema -y
bunx bunext build
bunx bunext sitemap

echo "Starting server on port ${PORT:-7227}..."

bun src/server.ts
