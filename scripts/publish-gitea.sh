#!/usr/bin/env bash
# Publishes a Cobble release to the Gitea mirror.
#
#   scripts/publish-gitea.sh
#
# Runs the same release gate as the GitHub script, tags HEAD with the
# package.json version, pushes main and the tag to the `gitea` remote, then
# creates the Gitea release over the API.
#
# Gitea has no release workflow, so nothing is built here: the image is built
# once by .github/workflows/release.yml and mirrored to
# git.tben.me/moduletrace/cobble. This script only publishes the source and
# the release object.
#
# The token comes from GITEA_TOKEN, or from the Gitea section of ~/.config/tea
# if the tea CLI is installed. It needs the `write:repository` scope on the
# repository, which is what the repo scope gives.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/publish-common.sh
. "$SCRIPT_DIR/lib/publish-common.sh"
# shellcheck source=lib/publish-release.sh
. "$SCRIPT_DIR/lib/publish-release.sh"

REMOTE="gitea"
TEA_CONFIG="${TEA_CONFIG:-$HOME/.config/tea/config.yml}"

usage() {
    cat <<EOF
Publishes a Cobble release to the Gitea mirror.

Usage: scripts/publish-gitea.sh [options]

Options:
  --version VERSION   Version to release, with or without the leading v.
                      Defaults to package.json's version.
  --branch NAME       Branch to publish from (default: main).
  --yes, -y           Do not prompt.
  --dry-run           Print what would run, change nothing locally or remotely.
  --skip-checks       Skip typecheck, tests and the install.sh syntax check.
  -h, --help          Show this help.

The release body is the commit log since the previous tag, the same text the
GitHub script publishes, since only GitHub can generate notes itself.

Environment:
  GITEA_TOKEN               Token with write:repository on the repository.
  TEA_CONFIG                The tea CLI config to read a token from.
                            Default: ~/.config/tea/config.yml
  DRY_RUN=1, ASSUME_YES=1   Same as --dry-run and --yes.
EOF
}

parse_publish_args "$@"
if [ "$HELP" = "1" ]; then
    usage
    exit 0
fi
reject_unknown_args "$0"

trap cleanup_notes EXIT

# MARK:tea-token
# Reads the token tea stored for a host, so an existing `tea login` is enough.
tea_token_for_host() {
    local host="$1"
    local config="${2:-$TEA_CONFIG}"

    if [ ! -f "$config" ]; then
        return 0
    fi
    if command -v python3 >/dev/null 2>&1; then
        python3 - "$config" "$host" <<'PY'
import re
import sys

path, host = sys.argv[1], sys.argv[2]
text = open(path, encoding="utf-8").read()
token = None
current = None
for line in text.splitlines():
    line = line.rstrip()
    if line.startswith("- name:"):
        current = line.split(":", 1)[1].strip().strip('"').strip("'")
        continue
    match = re.match(r"\s+url:\s*(.+)$", line)
    if match:
        url = match.group(1).strip().strip('"').strip("'")
        current = re.sub(r"^[a-z]+://", "", url)
        current = current.split("/")[0].split("@")[-1]
        continue
    match = re.match(r"\s+token:\s*(.+)$", line)
    if match and current == host:
        token = match.group(1).strip().strip('"').strip("'")
if token:
    print(token)
PY
        return 0
    fi

    # No python: the token line of the first login block that names the host.
    awk -v host="$host" '
        /- name:/ { block = $0; next }
        /url:/ { block = block " " $0 }
        /token:/ {
            if (index(block, host) > 0) {
                sub(/^[^:]*:[[:space:]]*/, "", $0)
                gsub(/["'"'"']/, "", $0)
                print $0
                exit
            }
        }
    ' "$config"
}
# END:tea-token

require_repo_root
preflight "$REMOTE"
resolve_version

remote_url="$(git remote get-url "$REMOTE")"
parse_remote_url "$remote_url"
API_URL="${GITEA_API_URL:-https://${REMOTE_HOST}/api/v1}"
REPO_SLUG="${REMOTE_OWNER}/${REMOTE_REPO}"
COMPARE_URL="https://${REMOTE_HOST}/${REPO_SLUG}/compare/"

step "Checking the Gitea token"
TOKEN="${GITEA_TOKEN:-}"
if [ -z "$TOKEN" ]; then
    TOKEN="$(tea_token_for_host "$REMOTE_HOST" | head -n1)"
    if [ -n "$TOKEN" ]; then
        detail "Using the token from $TEA_CONFIG."
    fi
fi
if [ -z "$TOKEN" ]; then
    fail "No Gitea token. Set GITEA_TOKEN, or run 'tea login add --url https://$REMOTE_HOST --token <token>'."
fi
ok "A token for $REMOTE_HOST is set."

require_cmd curl "Install curl."

run_release_checks
prepare_tag
write_notes_file "$COMPARE_URL"

step "Publishing $TAG to Gitea ($REPO_SLUG)"
printf '    %sremote%s  %s\n' "$C_DIM" "$C_RESET" "$remote_url"
printf '    %sapi%s     %s\n' "$C_DIM" "$C_RESET" "$API_URL"
printf '    %snotes%s   %s\n' "$C_DIM" "$C_RESET" "$NOTES_FILE"
confirm "Publish $TAG to Gitea?"

push_branch_and_tag "$REMOTE"

if is_dry_run; then
    # Nothing is asked of the server during a dry run.
    release_status="404"
else
    release_status="$(
        curl -s -o /dev/null -w '%{http_code}' \
            -H "Authorization: token $TOKEN" \
            -H "Accept: application/json" \
            "$API_URL/repos/$REPO_SLUG/releases/tags/$TAG" || printf '000'
    )"
fi

if [ "$release_status" = "200" ]; then
    release_already_exists "The Gitea release"
else
    body="$(cat "$NOTES_FILE")"
    payload="$(printf '{"tag_name":"%s","target_commitish":"%s","name":"%s","body":"%s","draft":false,"prerelease":false}' \
        "$TAG" \
        "$BRANCH" \
        "$TAG" \
        "$(json_escape "$body")")"

    # MARK:create-release
    if is_dry_run; then
        detail "[dry run] POST $API_URL/repos/$REPO_SLUG/releases"
        detail "[dry run] $payload"
        api_status="201"
    else
        response_file="$(mktemp -t cobble-gitea-release.XXXXXX)"
        api_status="$(
            printf '%s' "$payload" |
                curl -s -o "$response_file" -w '%{http_code}' \
                    -X POST \
                    -H "Authorization: token $TOKEN" \
                    -H "Accept: application/json" \
                    -H "Content-Type: application/json" \
                    --data-binary @- \
                    "$API_URL/repos/$REPO_SLUG/releases" || printf '000'
        )"
    fi
    # END:create-release

    case "$api_status" in
        201 | 200)
            ok "Created the Gitea release."
            ;;
        409)
            release_already_exists "The Gitea release"
            ;;
        *)
            if [ -n "${response_file:-}" ] && [ -s "$response_file" ]; then
                printf '%s\n' "$(cat "$response_file")" >&2
            fi
            if [ -n "${response_file:-}" ]; then
                rm -f "$response_file"
            fi
            if [ "$api_status" = "403" ]; then
                fail "Gitea answered HTTP 403: the token's user cannot write to $REPO_SLUG. The tags and $BRANCH still push over SSH, but creating a release needs the token's user to be a writer (write or admin) on the repository. Check it with: curl -s -H \"Authorization: token \$GITEA_TOKEN\" $API_URL/repos/$REPO_SLUG | grep -o '\"permissions\":{[^}]*}'"
            fi
            fail "Gitea answered HTTP $api_status for the release."
            ;;
    esac

    if [ -n "${response_file:-}" ]; then
        rm -f "$response_file"
    fi
fi

print_release_summary "$REMOTE" "$BRANCH" "https://${REMOTE_HOST}/${REPO_SLUG}/releases/tag/$TAG"
printf '\nThe image is built by the GitHub release; mirror it into the Gitea registry with:\n'
printf '    docker buildx imagetools create --tag git.tben.me/moduletrace/cobble:latest \\\n'
printf '        ghcr.io/moduletrace/cobble:latest\n'
