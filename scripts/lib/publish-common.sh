#!/usr/bin/env bash
# Shared helpers for the publish scripts.
#
#   . "$(dirname "$0")/lib/publish-common.sh"
#
# Never run this file: it only defines functions and constants, so the
# scripts own their own `set -Eeuo pipefail` and a test can source it
# without changing the caller's shell options.

# MARK:preamble
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

DRY_RUN="${DRY_RUN:-0}"
ASSUME_YES="${ASSUME_YES:-0}"
RELEASE_NOTES_MAX_COMMITS="${RELEASE_NOTES_MAX_COMMITS:-100}"

step() { printf '\n%s==>%s %s\n' "$C_BLUE$C_BOLD" "$C_RESET" "$*"; }
ok() { printf '%s ok%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '%swarn%s %s\n' "$C_YELLOW" "$C_RESET" "$*" >&2; }
detail() { printf '    %s%s%s\n' "$C_DIM" "$*" "$C_RESET"; }

fail() {
    printf '%sfail%s %s\n' "$C_RED" "$C_RESET" "$*" >&2
    exit 1
}

# Runs a command, or prints it when the script was asked for a dry run.
# Only use this for commands that can be spelled as a single command.
run() {
    if [ "$DRY_RUN" = "1" ]; then
        printf '    %s[dry run]%s %s\n' "$C_DIM" "$C_RESET" "$*"
        return 0
    fi
    "$@"
}

is_dry_run() { [ "$DRY_RUN" = "1" ]; }
# END:preamble

# MARK:require-cmd
require_cmd() {
    local name="$1"
    local hint="${2:-}"
    if ! command -v "$name" >/dev/null 2>&1; then
        if [ -n "$hint" ]; then
            fail "Missing '$name'. $hint"
        fi
        fail "Missing '$name'."
    fi
}
# END:require-cmd

# Moves into the top of the checkout and remembers it as ROOT.
require_repo_root() {
    ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || fail "Not inside a git checkout."
    cd "$ROOT"
    export ROOT
}

# MARK:git-state
require_clean_worktree() {
    local dirty
    dirty="$(git status --porcelain --untracked-files=no)"
    if [ -n "$dirty" ]; then
        printf '%s\n' "$dirty" >&2
        fail "The working tree has uncommitted changes. Commit or stash them before publishing."
    fi
}

require_on_branch() {
    local branch="$1"
    local current
    current="$(git rev-parse --abbrev-ref HEAD)"
    if [ "$current" != "$branch" ]; then
        fail "On '$current', not '$branch'. Check out $branch before publishing (or pass --branch)."
    fi
}

require_remote() {
    local remote="$1"
    if ! git remote get-url "$remote" >/dev/null 2>&1; then
        fail "No '$remote' git remote. Add it with: git remote add $remote <url>"
    fi
}

# Fails when the remote branch has commits HEAD does not have. HEAD being
# ahead is fine: the script pushes.
require_not_behind() {
    local remote="$1"
    local branch="$2"
    local counts ahead behind

    # A remote with no branch yet is not behind: the first push creates it.
    if ! git ls-remote --exit-code --heads "$remote" "refs/heads/$branch" >/dev/null 2>&1; then
        detail "$remote has no $branch yet; the first push creates it."
        return 0
    fi

    git fetch --quiet "$remote" "$branch" || fail "Could not fetch $remote/$branch."
    if ! git rev-parse -q --verify "refs/remotes/$remote/$branch" >/dev/null; then
        return 0
    fi

    counts="$(git rev-list --left-right --count "HEAD...$remote/$branch")"
    ahead="$(printf '%s' "$counts" | cut -f1)"
    behind="$(printf '%s' "$counts" | cut -f2)"
    if [ "$behind" != "0" ]; then
        fail "$remote/$branch has $behind commit(s) HEAD does not have. Pull before publishing."
    fi
    if [ "$ahead" != "0" ]; then
        detail "HEAD is $ahead commit(s) ahead of $remote/$branch; they are pushed with the release."
    fi
}

# Prints the tag already on the remote for a version, or nothing.
remote_tag_exists() {
    local remote="$1"
    local tag="$2"
    local found
    found="$(git ls-remote --tags "$remote" "refs/tags/$tag" 2>/dev/null || true)"
    [ -n "$found" ] && printf 'yes'
}

local_tag_exists() {
    git rev-parse -q --verify "refs/tags/$1" >/dev/null
}

# Creates the annotated tag when it is missing, and reuses an existing one.
ensure_tag() {
    local tag="$1"
    local message="${2:-$1}"
    if local_tag_exists "$tag"; then
        ok "Tag $tag already exists locally; reusing it."
        return 0
    fi
    run git tag -a "$tag" -m "$message"
}
# END:git-state

# MARK:remote-url
# Splits a git remote URL into REMOTE_HOST, REMOTE_OWNER and REMOTE_REPO.
# Understands git@host:owner/repo.git, ssh://git@host[:port]/owner/repo.git
# and https://host[:port]/owner/repo.git.
parse_remote_url() {
    local url="$1"
    local rest path

    case "$url" in
        *://*)
            rest="${url#*://}"
            rest="${rest#*@}"
            REMOTE_HOST="${rest%%/*}"
            path="${rest#*/}"
            ;;
        *@*:*)
            rest="${url#*@}"
            REMOTE_HOST="${rest%%:*}"
            path="${rest#*:}"
            ;;
        *)
            fail "Could not read a host out of the remote URL '$url'."
            ;;
    esac

    path="${path#/}"
    path="${path%.git}"
    REMOTE_OWNER="${path%%/*}"
    REMOTE_REPO="${path##*/}"

    if [ -z "$REMOTE_HOST" ] || [ -z "$REMOTE_OWNER" ] || [ -z "$REMOTE_REPO" ]; then
        fail "Could not read owner and repository out of the remote URL '$url'."
    fi
}
# END:remote-url

# MARK:version
VERSION_PATTERN='^[0-9]+\.[0-9]+\.[0-9]+([-+][0-9A-Za-z.+-]+)?$'

# Turns `0.1.2` or `v0.1.2` into `v0.1.2`.
normalize_version() {
    local raw="$1"
    printf 'v%s' "${raw#v}"
}

# Refuses anything that is not a release version, so a typo never becomes a
# tag that the release workflow cannot read a major.minor from.
validate_version() {
    local raw="$1"
    local bare="${raw#v}"
    if ! printf '%s' "$bare" | grep -Eq "$VERSION_PATTERN"; then
        fail "Version '$raw' is not a release version. Expected vMAJOR.MINOR.PATCH, e.g. v0.1.2."
    fi
}

# The version in package.json, read the same way the release workflow reads it.
source_version() {
    sed -n -E 's/^[[:space:]]*"version": "([^"]+)",?$/\1/p' "${ROOT:?}/package.json" | head -n1
}

# The newest release tag before `to`, or nothing when there is none.
previous_tag() {
    local to="$1"
    git -C "${ROOT:?}" describe --tags --abbrev=0 --match 'v[0-9]*' "${to}^" 2>/dev/null || true
}
# END:version

# MARK:notes
# Builds a release body from the commit log, so the Gitea mirror gets notes
# too (only GitHub can generate them itself).
release_notes() {
    local from=""
    local to=""
    local compare_url=""

    while [ $# -gt 0 ]; do
        case "$1" in
            --from) from="$2"; shift 2 ;;
            --to) to="$2"; shift 2 ;;
            --compare-url) compare_url="$2"; shift 2 ;;
            *) fail "release_notes: unknown argument '$1'." ;;
        esac
    done

    if [ -z "$to" ]; then
        fail "release_notes: --to is required."
    fi

    local range="$to"
    if [ -n "$from" ]; then
        range="$from..$to"
    fi

    local commits total
    commits="$(git -C "${ROOT:?}" log --no-merges --pretty=format:'- %s (%h)' --max-count="$RELEASE_NOTES_MAX_COMMITS" "$range")"
    total="$(git -C "$ROOT" log --no-merges --oneline "$range" | wc -l | tr -d ' ')"

    printf '## Changes\n\n'
    if [ -z "$commits" ]; then
        printf 'No commits listed.\n'
    else
        printf '%s\n' "$commits"
        if [ "$total" -gt "$RELEASE_NOTES_MAX_COMMITS" ]; then
            printf '\n_Showing the newest %s of %s commits._\n' "$RELEASE_NOTES_MAX_COMMITS" "$total"
        fi
    fi
    if [ -n "$compare_url" ]; then
        printf '\n**Full changelog**: %s\n' "$compare_url"
    fi
}
# END:notes

# MARK:json-escape
# Escapes a string for a JSON body. jq is used when it is installed, since it
# handles every control character; the bash fallback covers the ones release
# notes actually contain.
json_escape() {
    local text="$1"

    if command -v jq >/dev/null 2>&1; then
        # `-s` produces one JSON string; the quotes it wraps it in are the
        # characters the caller's template adds, so they come back off.
        local escaped
        escaped="$(printf '%s' "$text" | jq -R -s '.')"
        escaped="${escaped:1:${#escaped}-2}"
        printf '%s' "$escaped"
        return 0
    fi

    local out=""
    local char
    local i=0
    local length=${#text}
    while [ "$i" -lt "$length" ]; do
        char="${text:$i:1}"
        case "$char" in
            '\') out+='\\' ;;
            '"') out+='\"' ;;
            $'\n') out+='\n' ;;
            $'\r') out+='\r' ;;
            $'\t') out+='\t' ;;
            $'\b') out+='\b' ;;
            $'\f') out+='\f' ;;
            *) out+="$char" ;;
        esac
        i=$((i + 1))
    done
    printf '%s' "$out"
}
# END:json-escape

# MARK:confirm
confirm() {
    local prompt="$1"
    local answer=""

    if [ "$ASSUME_YES" = "1" ]; then
        return 0
    fi
    if [ ! -t 0 ]; then
        fail "Not a terminal, so nothing was confirmed. Rerun with --yes to publish without a prompt."
    fi
    read -r -p "$prompt [y/N] " answer || true
    case "$answer" in
        y | Y | yes | YES) return 0 ;;
        *) fail "Cancelled." ;;
    esac
}
# END:confirm
