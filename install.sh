#!/usr/bin/env bash
# Cobble installer and updater.
#
#   curl -fsSL https://raw.githubusercontent.com/moduletrace/cobble/main/install.sh | sudo bash
#
# The script is idempotent: running it again updates Cobble in place and
# keeps the data, the database and the generated secrets. It installs
# Docker when it is missing, creates the cobble network and starts the app
# container with the docker socket mounted, so the app can create the
# computers it runs.
set -Eeuo pipefail

CONTAINER="cobble"
NETWORK="cobble"
DEFAULT_PORT="7227"
DEFAULT_BIND="0.0.0.0"
DEFAULT_IMAGE="ghcr.io/moduletrace/cobble"
DEFAULT_VERSION="latest"
INSTALL_URL="https://raw.githubusercontent.com/moduletrace/cobble/main/install.sh"
HEALTH_TIMEOUT_SECONDS="${COBBLE_HEALTH_TIMEOUT:-900}"
BACKUPS_KEPT=5

if [ -t 1 ]; then
    C_RESET=$'\033[0m'
    C_BOLD=$'\033[1m'
    C_DIM=$'\033[2m'
    C_RED=$'\033[31m'
    C_GREEN=$'\033[32m'
    C_YELLOW=$'\033[33m'
    C_BLUE=$'\033[34m'
else
    C_RESET=""
    C_BOLD=""
    C_DIM=""
    C_RED=""
    C_GREEN=""
    C_YELLOW=""
    C_BLUE=""
fi

say() { printf '%s==>%s %s\n' "$C_BLUE" "$C_RESET" "$*"; }
ok() { printf '%s ok%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '%swarn%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
fail() {
    printf '%sfail%s %s\n' "$C_RED" "$C_RESET" "$*" >&2
    exit 1
}

on_error() {
    local code=$?
    printf '%sfail%s line %s exited with status %s\n' "$C_RED" "$C_RESET" "${BASH_LINENO[0]:-?}" "$code" >&2
    exit "$code"
}
trap on_error ERR

usage() {
    cat <<EOF
Cobble installer and updater

Usage:
  curl -fsSL $INSTALL_URL | sudo bash
  curl -fsSL $INSTALL_URL | sudo bash -s -- [options]

Options:
  --home DIR             Install directory (default /opt/cobble)
  --data-dir DIR         Data directory, mounted at /data (default HOME/data)
  --port PORT            Host port (default 7227)
  --bind ADDRESS         Host address to publish on (default 0.0.0.0)
  --image IMAGE          Container image (default $DEFAULT_IMAGE)
  --version TAG          Image tag (default latest)
  --no-pull              Use the image already on this machine
  --extra-network NAME   Join another docker network, e.g. a tunnel's
  --force                Recreate the container even when it is current
  --skip-backup          Do not back up the database before an update
  --no-docker-install    Fail instead of installing Docker when it is missing
  --uninstall            Stop and remove the app container
  --purge                With --uninstall, also delete the data directory
  --help                 Show this help

The data directory holds the database, media and every computer's home
directory. It is kept when the container is removed. Settings live in
HOME/.env; restart the container after changing them.
EOF
}

# ---------------------------------------------------------------- arguments

HOME_DIR=""
for ((i = 1; i <= $#; i++)); do
    case "${!i}" in
        --home)
            next=$((i + 1))
            [ "$next" -le $# ] || fail "--home needs a value"
            HOME_DIR="${!next}"
            ;;
        --help | -h)
            usage
            exit 0
            ;;
    esac
done

if [ -z "$HOME_DIR" ]; then
    HOME_DIR="${COBBLE_HOME:-}"
fi

if [ -z "$HOME_DIR" ] && [ "$(uname -s)" = "Darwin" ] && [ -n "${SUDO_USER:-}" ]; then
    user_home="$(dscl . -read "/Users/$SUDO_USER" NFSHomeDirectory 2>/dev/null | awk '{print $2}')"
    [ -n "$user_home" ] && HOME_DIR="$user_home/.cobble"
fi

if [ -z "$HOME_DIR" ]; then
    if [ "$(uname -s)" = "Darwin" ]; then
        HOME_DIR="$HOME/.cobble"
    else
        HOME_DIR="/opt/cobble"
    fi
fi

case "$HOME_DIR" in
    /*) ;;
    *) fail "--home must be an absolute path" ;;
esac

ENV_FILE="$HOME_DIR/.env"
STATE_FILE="$HOME_DIR/install.conf"

if [ -f "$STATE_FILE" ]; then
    # shellcheck disable=SC1090
    . "$STATE_FILE"
fi

DATA_DIR="${COBBLE_DATA_DIR:-}"
PORT="${COBBLE_PORT:-}"
BIND="${COBBLE_BIND:-}"
IMAGE="${COBBLE_IMAGE:-}"
VERSION="${COBBLE_VERSION:-}"
EXTRA_NETWORK="${COBBLE_EXTRA_NETWORK:-}"
DOCKER_SOCKET="${COBBLE_DOCKER_SOCKET:-${DOCKER_SOCKET:-/var/run/docker.sock}}"

ACTION="install"
FORCE=0
NO_PULL=0
NO_DOCKER_INSTALL=0
SKIP_BACKUP=0
PURGE=0

env_get() {
    local key="$1"
    [ -f "$ENV_FILE" ] || return 0
    sed -nE "s/^[[:space:]]*${key}=(.*)$/\1/p" "$ENV_FILE" | tail -n 1 | sed -e 's/^"//' -e 's/"$//'
}

if [ ! -f "$STATE_FILE" ] && [ -f "$ENV_FILE" ] && [ -z "$PORT" ]; then
    PORT="$(env_get PORT)"
fi

DATA_DIR="${DATA_DIR:-$HOME_DIR/data}"
PORT="${PORT:-$DEFAULT_PORT}"
BIND="${BIND:-$DEFAULT_BIND}"
IMAGE="${IMAGE:-$DEFAULT_IMAGE}"
VERSION="${VERSION:-$DEFAULT_VERSION}"

while [ $# -gt 0 ]; do
    case "$1" in
        --home)
            HOME_DIR="${2:-}"
            shift 2
            ;;
        --data-dir)
            DATA_DIR="${2:-}"
            shift 2
            ;;
        --port)
            PORT="${2:-}"
            shift 2
            ;;
        --bind)
            BIND="${2:-}"
            shift 2
            ;;
        --image)
            IMAGE="${2:-}"
            shift 2
            ;;
        --version)
            VERSION="${2:-}"
            shift 2
            ;;
        --extra-network)
            EXTRA_NETWORK="${2:-}"
            shift 2
            ;;
        --force)
            FORCE=1
            shift
            ;;
        --no-pull)
            NO_PULL=1
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=1
            shift
            ;;
        --no-docker-install)
            NO_DOCKER_INSTALL=1
            shift
            ;;
        --uninstall)
            ACTION="uninstall"
            shift
            ;;
        --purge)
            PURGE=1
            shift
            ;;
        --help | -h)
            usage
            exit 0
            ;;
        *)
            fail "Unknown option: $1. Use --help."
            ;;
    esac
done

[ -n "$HOME_DIR" ] || fail "--home needs a value"
[ -n "$DATA_DIR" ] || fail "--data-dir needs a value"
[ -n "$PORT" ] || fail "--port needs a value"
[ -n "$BIND" ] || fail "--bind needs a value"
[ -n "$IMAGE" ] || fail "--image needs a value"
[ -n "$VERSION" ] || fail "--version needs a value"

case "$HOME_DIR" in
    /*) ;;
    *) fail "--home must be an absolute path" ;;
esac

case "$DATA_DIR" in
    /*) ;;
    *) fail "--data-dir must be an absolute path" ;;
esac

case "$PORT" in
    '' | *[!0-9]*) fail "--port must be a number" ;;
esac
[ "$PORT" -ge 1 ] && [ "$PORT" -le 65535 ] || fail "--port must be between 1 and 65535"
case "$BIND" in
    '' | *[!0-9a-fA-F:.]*) fail "--bind must be an IP address" ;;
esac
case "$IMAGE" in
    '' | *[!A-Za-z0-9._/-]*) fail "--image may only contain letters, numbers, dot, dash, underscore and slash" ;;
esac
case "$VERSION" in
    '' | *[!A-Za-z0-9._-]*) fail "--version may only contain letters, numbers, dot, dash and underscore" ;;
esac
if [ -n "$EXTRA_NETWORK" ]; then
    case "$EXTRA_NETWORK" in
        *[!A-Za-z0-9_.-]*) fail "--extra-network is not a valid network name" ;;
    esac
fi
if [ "$PURGE" = 1 ] && [ "$ACTION" != "uninstall" ]; then
    fail "--purge only works with --uninstall"
fi

ENV_FILE="$HOME_DIR/.env"
STATE_FILE="$HOME_DIR/install.conf"
DATA_DIR="${DATA_DIR%/}"
BACKUP_DIR="$HOME_DIR/backups"

# ---------------------------------------------------------------- platform

OS="$(uname -s)"
case "$OS" in
    Linux | Darwin) ;;
    *) fail "Unsupported operating system: $OS. Cobble runs on Linux and macOS with Docker." ;;
esac

case "$(uname -m)" in
    x86_64 | amd64) ARCH="amd64" ;;
    aarch64 | arm64) ARCH="arm64" ;;
    *) fail "Unsupported architecture: $(uname -m)" ;;
esac

if [ "$OS" = "Linux" ] && [ "$(id -u)" -ne 0 ]; then
    fail "Run the installer as root: curl -fsSL $INSTALL_URL | sudo bash"
fi

SELINUX_SUFFIX=""
if [ "$OS" = "Linux" ]; then
    if command -v getenforce >/dev/null 2>&1 && [ "$(getenforce 2>/dev/null || true)" != "Disabled" ]; then
        SELINUX_SUFFIX=",z"
    elif [ -e /sys/fs/selinux/enforce ]; then
        SELINUX_SUFFIX=",z"
    fi
fi

ENV_MOUNT="$ENV_FILE:/app/.env:ro"
DATA_MOUNT="$DATA_DIR:/data"
if [ -n "$SELINUX_SUFFIX" ]; then
    ENV_MOUNT="$ENV_FILE:/app/.env:ro,z"
    DATA_MOUNT="$DATA_DIR:/data,z"
fi

# ---------------------------------------------------------------- helpers

gen_secret() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 32
    else
        od -An -N32 -tx1 /dev/urandom | tr -d ' \n'
    fi
}

env_has() {
    [ -f "$ENV_FILE" ] && grep -qE "^[[:space:]]*$1=" "$ENV_FILE"
}

ensure_env() {
    local key="$1" value="$2"
    if ! env_has "$key"; then
        printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
    fi
}

ensure_secret() {
    local key="$1" value
    value="$(env_get "$key")"
    if [ -z "$value" ]; then
        set_env "$key" "$(gen_secret)"
    fi
}

set_env() {
    local key="$1" value="$2" escaped
    escaped="$(printf '%s' "$value" | sed -e 's/[\/&]/\\&/g')"
    if env_has "$key"; then
        sed -i.bak -E "s|^[[:space:]]*${key}=.*$|${key}=${escaped}|" "$ENV_FILE"
        rm -f "$ENV_FILE.bak"
    else
        printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
    fi
}

container_exists() {
    docker container inspect "$CONTAINER" >/dev/null 2>&1
}

container_running() {
    [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || true)" = "true" ]
}

container_image_id() {
    docker inspect -f '{{.Image}}' "$CONTAINER"
}

port_in_use() {
    if [ "$OS" = "Darwin" ]; then
        lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1
    elif command -v ss >/dev/null 2>&1; then
        ss -ltnH "sport = :$PORT" 2>/dev/null | grep -q .
    elif command -v netstat >/dev/null 2>&1; then
        netstat -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]$PORT$"
    else
        return 1
    fi
}

docker_socket_mounted() {
    docker inspect -f '{{range .Mounts}}{{if eq .Destination "/var/run/docker.sock"}}{{.Source}}{{end}}{{end}}' "$CONTAINER"
}

container_matches() {
    container_running || return 1
    [ "$(container_image_id)" = "$TARGET_IMAGE_ID" ] || return 1
    [ "$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Source}}{{end}}{{end}}' "$CONTAINER")" = "$DATA_DIR" ] || return 1
    [ "$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/app/.env"}}{{.Source}}{{end}}{{end}}' "$CONTAINER")" = "$ENV_FILE" ] || return 1
    [ "$(docker_socket_mounted)" = "$DOCKER_SOCKET" ] || return 1
    [ "$(docker inspect -f '{{with index .HostConfig.PortBindings "'"$PORT"'/tcp"}}{{range .}}{{.HostIp}}:{{.HostPort}}{{end}}{{end}}' "$CONTAINER")" = "$BIND:$PORT" ] || return 1
    [ "$(docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' "$CONTAINER")" = "unless-stopped" ] || return 1
    [ "$(docker inspect -f '{{.HostConfig.Init}}' "$CONTAINER")" = "true" ] || return 1
    docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$CONTAINER" | grep -qx "MAIN_SERVER=1" || return 1
    docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$CONTAINER" | grep -qx "PORT=$PORT" || return 1
    docker inspect -f '{{range $name, $net := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$CONTAINER" | grep -qx "$NETWORK" || return 1
    if [ -n "$EXTRA_NETWORK" ]; then
        docker inspect -f '{{range $name, $net := .NetworkSettings.Networks}}{{println $name}}{{end}}' "$CONTAINER" | grep -qx "$EXTRA_NETWORK" || return 1
    fi
    return 0
}

health_host() {
    case "$BIND" in
        0.0.0.0 | :: | "") printf '127.0.0.1' ;;
        *) printf '%s' "$BIND" ;;
    esac
}

host_ips() {
    if [ "$OS" = "Darwin" ]; then
        ipconfig getifaddr en0 2>/dev/null || true
    elif command -v hostname >/dev/null 2>&1; then
        hostname -I 2>/dev/null | tr ' ' '\n' | grep -vE '^$|^127\.' | head -n 3 || true
    fi
}

wait_for_health() {
    local url="http://$(health_host):$PORT/api/health" start=0
    say "Waiting for Cobble to answer at $url"
    while [ "$start" -lt "$HEALTH_TIMEOUT_SECONDS" ]; do
        if curl -fsS --max-time 3 -o /dev/null "$url" 2>/dev/null; then
            ok "Cobble is healthy"
            return 0
        fi
        if ! container_running; then
            docker logs --tail 80 "$CONTAINER" 2>&1 || true
            fail "The Cobble container stopped during startup"
        fi
        sleep 3
        start=$((start + 3))
    done
    docker logs --tail 120 "$CONTAINER" 2>&1 || true
    fail "Cobble did not become healthy within ${HEALTH_TIMEOUT_SECONDS}s"
}

backup_database() {
    local data_source="$DATA_DIR"
    if container_exists; then
        local mounted
        mounted="$(docker inspect -f '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Source}}{{end}}{{end}}' "$CONTAINER" 2>/dev/null || true)"
        [ -n "$mounted" ] && data_source="$mounted"
    fi

    [ -f "$data_source/db/cobble" ] || return 0

    mkdir -p "$BACKUP_DIR"
    say "Backing up the database"

    local backup_mount="$data_source:/data"
    if [ -n "$SELINUX_SUFFIX" ]; then
        backup_mount="$backup_mount,z"
    fi

    local image_id=""
    if container_running; then
        if ! docker exec "$CONTAINER" bunx bun-sqlite backup >/dev/null 2>&1; then
            [ "$SKIP_BACKUP" = 1 ] && {
                warn "Could not back up the database, continuing because of --skip-backup"
                return 0
            }
            fail "Could not back up the database. Use --skip-backup to update anyway."
        fi
    elif container_exists; then
        image_id="$(container_image_id)"
        if ! docker run --rm --entrypoint bunx \
            -v "$backup_mount" -e DB_DIR=/data/db \
            "$image_id" bun-sqlite backup >/dev/null 2>&1; then
            [ "$SKIP_BACKUP" = 1 ] && {
                warn "Could not back up the database, continuing because of --skip-backup"
                return 0
            }
            fail "Could not back up the database. Use --skip-backup to update anyway."
        fi
    else
        return 0
    fi

    local newest
    newest="$(ls -1t "$data_source"/db/.backups/cobble-* 2>/dev/null | head -n 1 || true)"
    if [ -z "$newest" ]; then
        warn "No database backup file was written"
        return 0
    fi

    cp -a "$newest" "$BACKUP_DIR/$(basename "$newest")" 2>/dev/null || true
    ok "Backup: $BACKUP_DIR/$(basename "$newest")"

    local old
    old="$(ls -1t "$BACKUP_DIR"/cobble-* 2>/dev/null | tail -n +$((BACKUPS_KEPT + 1)) || true)"
    if [ -n "$old" ]; then
        printf '%s\n' "$old" | while IFS= read -r file; do
            rm -f "$file"
        done
    fi
}

safe_remove_dir() {
    local dir="$1"
    case "$dir" in
        / | /opt | /home | /root | /var | /usr | /etc | /data | /mnt | /srv | /tmp)
            fail "Refusing to delete $dir"
            ;;
    esac
    case "$dir" in
        /*/*) ;;
        *) fail "Refusing to delete $dir" ;;
    esac
    rm -rf "$dir"
}

connect_extra_network() {
    [ -n "$EXTRA_NETWORK" ] || return 0
    docker network inspect "$EXTRA_NETWORK" >/dev/null 2>&1 || fail "Network '$EXTRA_NETWORK' does not exist"
    docker network connect "$EXTRA_NETWORK" "$CONTAINER" >/dev/null 2>&1 || true
}

run_container() {
    docker run -d \
        --name "$CONTAINER" \
        --restart unless-stopped \
        --init \
        --network "$NETWORK" \
        -p "$BIND:$PORT:$PORT" \
        -v "$ENV_MOUNT" \
        -v "$DATA_MOUNT" \
        -v "$DOCKER_SOCKET:/var/run/docker.sock" \
        -e MAIN_SERVER=1 \
        -e PORT="$PORT" \
        --log-driver json-file \
        --log-opt max-size=10m \
        --log-opt max-file=3 \
        "$IMAGE:$VERSION" >/dev/null
}

# ---------------------------------------------------------------- docker

ensure_docker() {
    if ! command -v docker >/dev/null 2>&1; then
        if [ "$NO_DOCKER_INSTALL" = 1 ]; then
            fail "Docker is not installed. Install it and rerun, or drop --no-docker-install."
        fi
        if [ "$OS" != "Linux" ]; then
            fail "Docker is not installed. Install Docker Desktop, then rerun."
        fi
        say "Installing Docker"
        local script
        script="$(mktemp)"
        curl -fsSL https://get.docker.com -o "$script"
        sh "$script"
        rm -f "$script"
    fi

    if ! docker info >/dev/null 2>&1; then
        if [ "$OS" = "Darwin" ]; then
            fail "Docker Desktop is not running. Start it, then rerun."
        fi
        if command -v systemctl >/dev/null 2>&1; then
            systemctl enable --now docker >/dev/null 2>&1 || true
        elif command -v service >/dev/null 2>&1; then
            service docker start >/dev/null 2>&1 || true
        fi
    fi

    docker info >/dev/null 2>&1 || fail "Docker is installed but not running"

    if [ ! -S "$DOCKER_SOCKET" ]; then
        fail "No docker socket at $DOCKER_SOCKET"
    fi
}

# ---------------------------------------------------------------- uninstall

uninstall() {
    if container_exists; then
        say "Stopping Cobble"
        docker stop -t 30 "$CONTAINER" >/dev/null 2>&1 || true
        docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
    fi

    local computers
    computers="$(docker ps -aq --filter 'label=cobble.computer_id' 2>/dev/null || true)"
    if [ -n "$computers" ]; then
        say "Removing computer containers"
        while IFS= read -r id; do
            [ -n "$id" ] && docker rm -f "$id" >/dev/null 2>&1 || true
        done <<<"$computers"
    fi

    if docker network inspect "$NETWORK" >/dev/null 2>&1; then
        local attached
        attached="$(docker network inspect -f '{{len .Containers}}' "$NETWORK" 2>/dev/null || echo 1)"
        if [ "$attached" = "0" ]; then
            docker network rm "$NETWORK" >/dev/null 2>&1 || true
        fi
    fi

    if [ "$PURGE" = 1 ]; then
        safe_remove_dir "$HOME_DIR"
        if [ "$DATA_DIR" != "$HOME_DIR" ] && [ "$DATA_DIR" != "$HOME_DIR/data" ]; then
            safe_remove_dir "$DATA_DIR"
        fi
        ok "Removed Cobble and its data"
    else
        ok "Cobble stopped. Data kept in $HOME_DIR"
    fi
    exit 0
}

# ---------------------------------------------------------------- main

command -v curl >/dev/null 2>&1 || fail "curl is required"

ensure_docker

if [ "$ACTION" = "uninstall" ]; then
    uninstall
fi

mkdir -p "$HOME_DIR" "$DATA_DIR" "$BACKUP_DIR"
chmod 755 "$HOME_DIR" "$DATA_DIR" "$BACKUP_DIR"

if ! docker network inspect "$NETWORK" >/dev/null 2>&1; then
    say "Creating the $NETWORK network"
    docker network create "$NETWORK" >/dev/null
fi

if [ -n "$EXTRA_NETWORK" ]; then
    docker network inspect "$EXTRA_NETWORK" >/dev/null 2>&1 || fail "Network '$EXTRA_NETWORK' does not exist"
fi

if [ ! -f "$ENV_FILE" ]; then
    (umask 077
        cat >"$ENV_FILE" <<EOF
# Cobble settings. Restart the container after changing them:
#   docker restart $CONTAINER
PORT=$PORT
ENCRYPTION_KEY=$(gen_secret)
ENCRYPTION_SALT=$(gen_secret)
PAGE_LASTMOD_FILE=/data/sitemap-lastmod.json
EOF
    )
fi
chmod 600 "$ENV_FILE"
set_env PORT "$PORT"
ensure_secret ENCRYPTION_KEY
ensure_secret ENCRYPTION_SALT
ensure_env PAGE_LASTMOD_FILE "/data/sitemap-lastmod.json"

{
    printf 'COBBLE_DATA_DIR=%q\n' "$DATA_DIR"
    printf 'COBBLE_PORT=%q\n' "$PORT"
    printf 'COBBLE_BIND=%q\n' "$BIND"
    printf 'COBBLE_IMAGE=%q\n' "$IMAGE"
    printf 'COBBLE_VERSION=%q\n' "$VERSION"
    printf 'COBBLE_EXTRA_NETWORK=%q\n' "$EXTRA_NETWORK"
    printf 'COBBLE_DOCKER_SOCKET=%q\n' "$DOCKER_SOCKET"
} >"$STATE_FILE"
chmod 600 "$STATE_FILE"

if ! container_exists && port_in_use; then
    fail "Port $PORT is already in use. Pass --port with a free port."
fi

if [ "$NO_PULL" = 1 ]; then
    docker image inspect "$IMAGE:$VERSION" >/dev/null 2>&1 || fail "Image $IMAGE:$VERSION is not available locally"
else
    say "Pulling $IMAGE:$VERSION"
    if ! docker pull "$IMAGE:$VERSION" >/dev/null; then
        fail "Could not pull $IMAGE:$VERSION"
    fi
fi
TARGET_IMAGE_ID="$(docker image inspect -f '{{.Id}}' "$IMAGE:$VERSION")"
IMAGE_ARCH="$(docker image inspect -f '{{.Architecture}}' "$IMAGE:$VERSION")"
if [ "$IMAGE_ARCH" != "$ARCH" ]; then
    fail "Image $IMAGE:$VERSION is $IMAGE_ARCH but this machine is $ARCH. Pull the multi-arch image instead of --no-pull."
fi

if [ "$FORCE" = 0 ] && container_matches; then
    connect_extra_network
    if curl -fsS --max-time 3 -o /dev/null "http://$(health_host):$PORT/api/health" 2>/dev/null; then
        ok "Cobble is already up to date"
        say "Healthy at http://$(health_host):$PORT"
        exit 0
    fi
    warn "The container is running but not answering; recreating it"
fi

if container_exists; then
    backup_database
    say "Replacing the Cobble container"
    docker stop -t 30 "$CONTAINER" >/dev/null 2>&1 || true
    docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
fi

say "Starting Cobble"
run_container
connect_extra_network

wait_for_health

ok "Cobble is running"
printf '\n'
printf '  %s%s%s\n' "$C_BOLD" "Open Cobble" "$C_RESET"
if [ "$BIND" = "0.0.0.0" ]; then
    while IFS= read -r ip; do
        [ -n "$ip" ] && printf '    http://%s:%s\n' "$ip" "$PORT"
    done < <(host_ips)
fi
printf '    http://127.0.0.1:%s\n' "$PORT"
printf '\n'
printf '  First visit: create the super admin account.\n'
printf '  Data:        %s\n' "$DATA_DIR"
printf '  Settings:    %s\n' "$ENV_FILE"
printf '  Backups:     %s\n' "$BACKUP_DIR"
printf '  Logs:        docker logs -f %s\n' "$CONTAINER"
printf '  Update:      curl -fsSL %s | sudo bash\n' "$INSTALL_URL"
printf '  Uninstall:   curl -fsSL %s | sudo bash -s -- --uninstall\n' "$INSTALL_URL"
printf '\n'
if [ "$BIND" = "0.0.0.0" ]; then
    printf '  %sThis port is reachable on your network. Put HTTPS in front before exposing it to the internet.%s\n\n' "$C_DIM" "$C_RESET"
fi
