#!/bin/bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

read_env_var() {
    local key="$1" line value
    line="$(grep -E "^[[:space:]]*(export[[:space:]]+)?${key}=" "$ENV_FILE" | tail -n 1 || true)"
    value="${line#*=}"
    value="${value%$'\r'}"
    if [[ "$value" =~ ^\"(.*)\"$ ]] || [[ "$value" =~ ^\'(.*)\'$ ]]; then
        value="${BASH_REMATCH[1]}"
    fi
    printf '%s' "$value"
}

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found." >&2
    exit 1
fi

DEPLOY_NAME="bunext-sqlite"
SOURCE_PATH="${SOURCE_DIRECTORY:-$(read_env_var SOURCE_DIRECTORY)}"
SERVER_IP="${DEPLOY_SERVER_IP:-$(read_env_var DEPLOY_SERVER_IP)}"
SSH_USER="${SSH_USER:-$(read_env_var SSH_USER)}"
SSH_USER="${SSH_USER:-root}"
SERVER_PATH="/docker/$DEPLOY_NAME"
SSH_KEY="$HOME/.ssh/tben"
SSH_OPTS=(-i "$SSH_KEY")
REMOTE="$SSH_USER@$SERVER_IP"

if [ ! -d "$SOURCE_PATH" ] || [ "$(realpath -m "$SOURCE_PATH")" = "/" ]; then
    echo "Error: SOURCE_DIRECTORY is invalid, missing, or set to root path ('/')." >&2
    exit 1
fi

if [ -z "$SERVER_IP" ]; then
    echo "Error: DEPLOY_SERVER_IP is not set (shell env or $ENV_FILE)." >&2
    exit 1
fi

if [ ! -f "$SOURCE_PATH/secrets/prod.env" ]; then
    echo "Error: $SOURCE_PATH/secrets/prod.env not found." >&2
    exit 1
fi

cd "$SOURCE_PATH"

rsync -avz -e "ssh -i $SSH_KEY" --delete \
  --exclude='secrets/' --exclude='.env' \
  --filter=':- .gitignore' \
  "$SOURCE_PATH/" "$REMOTE:$SERVER_PATH/"

rsync -avz -e "ssh -i $SSH_KEY" --chmod=F600 \
  "$SOURCE_PATH/secrets/prod.env" "$REMOTE:$SERVER_PATH/.env"

ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s -- "$DEPLOY_NAME" << 'EOF'
set -euo pipefail
DEPLOY_NAME="$1"

cd "/docker/$DEPLOY_NAME"
docker build -t "$DEPLOY_NAME" .

docker rm -f "$DEPLOY_NAME" 2>/dev/null || true

docker run --name "$DEPLOY_NAME" -d \
  --network cloudflare \
  -v "/data/$DEPLOY_NAME/.data:/data" \
  --cpus 1 --memory 1g \
  --env-file "/docker/$DEPLOY_NAME/.env" \
  --restart unless-stopped \
  "$DEPLOY_NAME:latest"

docker image prune -f
EOF