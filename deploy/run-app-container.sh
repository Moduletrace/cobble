#!/bin/bash
# Builds the app's image and (re)starts its container. Rerun it to update:
# the database, media and computers' home directories (the data dir) and
# .env stay on the host. The container needs the docker socket, since it
# creates every computer as a container on the cobble network.
#
#   COBBLE_DATA_DIR       host data dir, mounted at /data (default /data/cobble)
#   COBBLE_BIND           host address the app is published on (default 127.0.0.1)
#   COBBLE_EXTRA_NETWORK  another docker network to join, e.g. a tunnel's
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
NAME="cobble"
NETWORK="cobble"
DATA_PATH="${COBBLE_DATA_DIR:-/data/cobble}"
BIND="${COBBLE_BIND:-127.0.0.1}"
DOCKER_SOCKET="/var/run/docker.sock"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found. Copy .env.example and set ENCRYPTION_KEY and ENCRYPTION_SALT." >&2
    exit 1
fi

if [ ! -S "$DOCKER_SOCKET" ]; then
    echo "Error: no docker socket at $DOCKER_SOCKET. Computers run in docker, so the app needs it." >&2
    exit 1
fi

PORT="$(grep -E '^[[:space:]]*PORT=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d "\"' \r")"
PORT="${PORT:-7227}"

mkdir -p "$DATA_PATH"

docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK" >/dev/null

docker build -t "$NAME" "$PROJECT_ROOT"

docker stop -t 30 "$NAME" >/dev/null 2>&1 || true
docker rm -f "$NAME" >/dev/null 2>&1 || true

docker run --name "$NAME" -d \
  --network "$NETWORK" \
  -p "$BIND:$PORT:$PORT" \
  -v "$ENV_FILE:/app/.env:ro" \
  -v "$DATA_PATH:/data" \
  -v "$DOCKER_SOCKET:$DOCKER_SOCKET" \
  -e MAIN_SERVER=1 \
  --cpus 1 --memory 1g \
  --restart unless-stopped \
  "$NAME:latest"

if [ -n "${COBBLE_EXTRA_NETWORK:-}" ]; then
    docker network connect "$COBBLE_EXTRA_NETWORK" "$NAME"
fi

docker image prune -f >/dev/null

echo "Cobble is starting on http://$BIND:$PORT (data in $DATA_PATH)"
