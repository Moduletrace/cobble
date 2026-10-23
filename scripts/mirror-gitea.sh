#!/usr/bin/env bash
# Copies a published Cobble image from GHCR into the Gitea registry.
#
#   scripts/mirror-gitea.sh
#
# The Gitea registry is on the VPN and GitHub Actions runners are on the
# public internet, so CI can never reach it. The release workflow therefore
# builds and pushes to GHCR only, and this script mirrors the result
# separately: a registry that is unreachable, slow or full can never fail a
# release the installer depends on.
#
# It copies from the Gitea host itself, because that host reaches GHCR over
# the public internet and its own registry over the docker network it shares
# with it. Nothing has to be installed on that host: skopeo runs there in a
# container.
#
# `skopeo copy --all` keeps the manifest list and its signatures, so every
# architecture comes across and the digest is unchanged. Each destination tag
# is then read back and compared, so a partial copy is reported as a failure
# instead of being assumed to have worked.
#
# Run it after scripts/publish-github.sh: that release is what builds the
# image, so there is nothing to copy until it has finished.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/publish-common.sh
. "$SCRIPT_DIR/lib/publish-common.sh"
# shellcheck source=lib/publish-release.sh
. "$SCRIPT_DIR/lib/publish-release.sh"

SOURCE_REPO="${MIRROR_SOURCE_REPO:-moduletrace/cobble}"
SOURCE_REGISTRY_HOST="${MIRROR_SOURCE_REGISTRY_HOST:-ghcr.io}"
HOST="${MIRROR_HOST:-10.7.0.4}"
HOST_USER="${MIRROR_HOST_USER:-root}"
REGISTRY_HOST="${MIRROR_REGISTRY_HOST:-gitea:3000}"
REGISTRY_REPO="${MIRROR_REGISTRY_REPO:-moduletrace/cobble}"
# The name a person types, which is not the one the copy uses: the host
# reaches its registry by docker network name, while an install reaches it
# through the proxy in front of it.
REGISTRY_PUBLIC_HOST="${MIRROR_REGISTRY_PUBLIC_HOST:-git.tben.me}"
NETWORK="${MIRROR_NETWORK:-cloudflare}"
SKOPEO_IMAGE="${MIRROR_SKOPEO_IMAGE:-quay.io/skopeo/stable:latest}"
MIRROR_USER="${MIRROR_USER:-cobble}"
CONNECT_TIMEOUT="${MIRROR_CONNECT_TIMEOUT:-10}"

usage() {
    cat <<EOF
Copies a published Cobble image from GHCR into the Gitea registry.

Usage: scripts/mirror-gitea.sh [options]

Options:
  --version VERSION   Version to mirror, with or without the leading v.
                      Defaults to package.json's version.
  --yes, -y           Do not prompt.
  --dry-run           Print what would run, copy nothing.
  -h, --help          Show this help.

The version is copied as vX.Y.Z and sha-<commit>. It is copied as latest and
major.minor too, but only while it is still the newest release in GHCR, so
mirroring an older release never rolls those two tags backwards. Every
destination is read back and its digest compared with GHCR's.

Run it after scripts/publish-github.sh, and after the image build for that
release has finished.

Environment:
  GITEA_TOKEN              Token for the registry (required).
  MIRROR_HOST              The Gitea host to copy from over the VPN.
                           Default: 10.7.0.4
  MIRROR_HOST_USER         Its ssh user. Default: root
  MIRROR_REGISTRY_HOST     The registry as that host sees it, by its docker
                           network name. Default: gitea:3000
  MIRROR_REGISTRY_PUBLIC_HOST
                           The registry's public name, for the pull command
                           it prints. Default: git.tben.me
  MIRROR_SOURCE_REGISTRY_HOST
                           Where the release workflow pushed.
                           Default: ghcr.io
  MIRROR_NETWORK           The docker network the registry is on, so the
                           copy container can resolve it.
                           Default: cloudflare
  MIRROR_USER              The registry user for basic auth. Default: cobble
  MIRROR_SKOPEO_IMAGE      The skopeo image the host runs.
                           Default: quay.io/skopeo/stable:latest
  DRY_RUN=1, ASSUME_YES=1  Same as --dry-run and --yes.
EOF
}

parse_publish_args "$@"
if [ "$HELP" = "1" ]; then
    usage
    exit 0
fi
reject_unknown_args "$0"

# MARK:mirror-tags
# The moving tag a release owns: major.minor, read from the version the same
# way the release workflow reads it, so the two never disagree.
mirror_minor_tag() {
    printf '%s' "${1#v}" | sed -E 's/^([0-9]+)\.([0-9]+).*/\1.\2/'
}

# The commit tag for a release: the first 12 characters of the commit the
# tag points at, which is `sha-${GITHUB_SHA::12}` in the workflow.
mirror_sha_tag() {
    local sha
    sha="$(git rev-parse -q --verify "refs/tags/$1^{commit}" 2>/dev/null || true)"
    if [ -z "$sha" ]; then
        return 1
    fi
    printf 'sha-%s' "${sha:0:12}"
}

# The tags this release owns outright, which no newer release claims.
mirror_fixed_tags() {
    local sha_tag
    printf '%s\n' "$1"
    if sha_tag="$(mirror_sha_tag "$1")"; then
        printf '%s\n' "$sha_tag"
    fi
}

# The tags a newer release takes over.
mirror_moving_tags() {
    printf 'latest\n%s\n' "$(mirror_minor_tag "$1")"
}
# END:mirror-tags

# MARK:mirror-guard
# Whether this release may still write the moving tags. It may while GHCR's
# `latest` is its own image: once a newer release has moved `latest`, copying
# an older version into the Gitea registry must not drag it back.
mirror_owns_moving_tags() {
    if [ -z "$2" ]; then
        # Nothing to compare against, so this release is taken as the newest.
        return 0
    fi
    [ "$1" = "$2" ]
}
# END:mirror-guard

# MARK:mirror-digest
MANIFEST_ACCEPT="application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json"

# Reads a tag's digest from GHCR over the public internet. The token is
# anonymous: the image is public, and a registry answers a bare manifest
# request with 401 until it is given one.
github_registry_digest() {
    local tag="$1"
    local token
    token="$(
        curl -sSf "https://$SOURCE_REGISTRY_HOST/token?scope=repository:$SOURCE_REPO:pull" 2>/dev/null |
            sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
    )" || return 1
    if [ -z "$token" ]; then
        return 1
    fi
    curl -sSf -o /dev/null -D- \
        -H "Authorization: Bearer $token" \
        -H "Accept: $MANIFEST_ACCEPT" \
        "https://$SOURCE_REGISTRY_HOST/v2/$SOURCE_REPO/manifests/$tag" 2>/dev/null |
        tr -d '\r' | sed -n 's/^docker-content-digest: //Ip' | head -n1
}
# END:mirror-digest

# MARK:mirror-remote
# Runs a bash script on the Gitea host, which is the one place that reaches
# both registries. The script arrives on stdin, so nothing is installed there
# and no quoting has to survive a round trip through ssh.
mirror_on_host() {
    ssh -o BatchMode=yes -o ConnectTimeout="$CONNECT_TIMEOUT" "$HOST_USER@$HOST" \
        "MIRROR_NETWORK='$NETWORK' MIRROR_SKOPEO_IMAGE='$SKOPEO_IMAGE' bash -s"
}

# Reads a destination tag's digest back from the registry. Empty means the
# tag is not there, which a caller reports differently from a mismatch.
mirror_digest_on_host() {
    mirror_on_host <<REMOTE
set -uo pipefail
docker run --rm --network "\$MIRROR_NETWORK" "\$MIRROR_SKOPEO_IMAGE" \\
    inspect --tls-verify=false --creds '$MIRROR_USER:$GITEA_TOKEN' \\
    --format '{{.Digest}}' 'docker://$REGISTRY_HOST/$REGISTRY_REPO:$1' 2>/dev/null | tail -n1
REMOTE
}

# Copies one tag, leaving skopeo's output in MIRROR_COPY_LOG so a failure can
# be shown without streaming its progress into the report.
mirror_copy_on_host() {
    MIRROR_COPY_LOG="$(mktemp -t cobble-mirror.XXXXXX)"
    mirror_on_host <<REMOTE >"$MIRROR_COPY_LOG" 2>&1
set -uo pipefail
docker run --rm --network "\$MIRROR_NETWORK" "\$MIRROR_SKOPEO_IMAGE" \\
    copy --all --retry-times 5 \\
    --src-tls-verify=true --dest-tls-verify=false \\
    --dest-creds '$MIRROR_USER:$GITEA_TOKEN' \\
    'docker://$SOURCE_REGISTRY_HOST/$SOURCE_REPO:$1' \\
    'docker://$REGISTRY_HOST/$REGISTRY_REPO:$2'
REMOTE
}
# END:mirror-remote

# MARK:mirror-main
require_repo_root

step "Resolving the version"
if [ -z "$VERSION_RAW" ]; then
    VERSION_RAW="$(source_version)"
    if [ -z "$VERSION_RAW" ]; then
        fail "No version in package.json and none passed with --version."
    fi
    detail "Read from package.json: $VERSION_RAW"
fi
validate_version "$VERSION_RAW"
TAG="$(normalize_version "$VERSION_RAW")"
ok "Mirroring $TAG."

require_cmd git
require_cmd ssh "Install an ssh client."
require_cmd curl "Install curl."

if [ -z "${GITEA_TOKEN:-}" ]; then
    fail "No Gitea token. Set GITEA_TOKEN to a token whose user can push packages to the $REGISTRY_REPO owner."
fi

step "Checking the released image in $SOURCE_REGISTRY_HOST"
SOURCE_DIGEST="$(github_registry_digest "$TAG")" ||
    fail "No $TAG in $SOURCE_REGISTRY_HOST/$SOURCE_REPO. Publish the GitHub release first: scripts/publish-github.sh builds the image."
if [ -z "$SOURCE_DIGEST" ]; then
    fail "No $TAG in $SOURCE_REGISTRY_HOST/$SOURCE_REPO. Publish the GitHub release first: scripts/publish-github.sh builds the image."
fi
ok "$TAG is $SOURCE_DIGEST."

LATEST_DIGEST="$(github_registry_digest latest || true)"

TAGS_TO_COPY="$(mirror_fixed_tags "$TAG")"
MOVING_SKIPPED=""
if mirror_owns_moving_tags "$SOURCE_DIGEST" "$LATEST_DIGEST"; then
    TAGS_TO_COPY="$(
        printf '%s\n%s\n' "$TAGS_TO_COPY" "$(mirror_moving_tags "$TAG")" |
            awk 'NF && !seen[$0]++'
    )"
else
    MOVING_SKIPPED="$(mirror_moving_tags "$TAG" | tr '\n' ' ')"
fi

step "Mirroring $TAG into the Gitea registry"
printf '    %shost%s     %s\n' "$C_DIM" "$C_RESET" "$HOST_USER@$HOST"
printf '    %sregistry%s %s/%s\n' "$C_DIM" "$C_RESET" "$REGISTRY_HOST" "$REGISTRY_REPO"
printf '    %ssource%s   %s/%s\n' "$C_DIM" "$C_RESET" "$SOURCE_REGISTRY_HOST" "$SOURCE_REPO"
printf '    %stags%s     %s\n' "$C_DIM" "$C_RESET" "$(printf '%s' "$TAGS_TO_COPY" | tr '\n' ' ')"
if [ -n "$MOVING_SKIPPED" ]; then
    warn "$SOURCE_REGISTRY_HOST/$SOURCE_REPO:latest belongs to a newer release, so ${MOVING_SKIPPED% } is left where it is."
fi

step "Checking the Gitea host"
if is_dry_run; then
    detail "[dry run] ssh -o BatchMode=yes $HOST_USER@$HOST 'bash -s'"
    remote_hostname="$HOST"
else
    remote_hostname="$(
        mirror_on_host <<'REMOTE'
hostname
REMOTE
    )" || fail "Could not reach $HOST_USER@$HOST over ssh. The Gitea host is on the VPN: connect to it first."
    ok "Reached $remote_hostname."
fi

confirm "Mirror $TAG into $REGISTRY_HOST/$REGISTRY_REPO?"

failed=0
for dest_tag in $TAGS_TO_COPY; do
    step "Copying $TAG to $dest_tag"

    if is_dry_run; then
        detail "[dry run] skopeo copy --all $SOURCE_REGISTRY_HOST/$SOURCE_REPO:$TAG -> $REGISTRY_HOST/$REGISTRY_REPO:$dest_tag"
        continue
    fi

    if ! mirror_copy_on_host "$TAG" "$dest_tag"; then
        sed -n '$!{/^$/d};p' "${MIRROR_COPY_LOG:-/dev/null}" 2>/dev/null | tail -n 8 >&2
        warn "The copy to $dest_tag failed."
        failed=1
        continue
    fi

    # The digest is what makes the two registries the same image: a copy that
    # stored a different manifest list would read back differently here.
    copied_digest="$(mirror_digest_on_host "$dest_tag")"
    if [ "$copied_digest" != "$SOURCE_DIGEST" ]; then
        warn "$dest_tag reads back as ${copied_digest:-nothing}, not $SOURCE_DIGEST."
        failed=1
        continue
    fi
    ok "$dest_tag is $SOURCE_DIGEST."
done

if [ -n "${MIRROR_COPY_LOG:-}" ] && [ -f "$MIRROR_COPY_LOG" ]; then
    rm -f "$MIRROR_COPY_LOG"
fi

step "Mirrored $TAG"
printf '    %sregistry%s %s/%s\n' "$C_DIM" "$C_RESET" "$REGISTRY_HOST" "$REGISTRY_REPO"
printf '    %stags%s     %s\n' "$C_DIM" "$C_RESET" "$(printf '%s' "$TAGS_TO_COPY" | tr '\n' ' ')"
printf '    %sdigest%s   %s\n' "$C_DIM" "$C_RESET" "$SOURCE_DIGEST"
if [ "$DRY_RUN" = "1" ]; then
    printf '\n%sDry run: copied nothing.%s\n' "$C_YELLOW" "$C_RESET"
fi

if [ "$failed" = "1" ]; then
    fail "The Gitea registry does not match $SOURCE_REGISTRY_HOST/$SOURCE_REPO. The release itself is unaffected: the installer defaults to GHCR."
fi

printf '\nAn install that can reach the Gitea registry can pull it with:\n'
printf '    curl -fsSL https://url.moduletrace.com/cobble | sudo bash -s -- --image %s/%s:%s\n' \
    "$REGISTRY_PUBLIC_HOST" "$REGISTRY_REPO" "$TAG"
# END:mirror-main
