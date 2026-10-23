#!/usr/bin/env bash
# The release flow both publish scripts share: argument parsing, preflight
# checks, tag preparation and the push.
#
#   . "$(dirname "$0")/lib/publish-common.sh"
#   . "$(dirname "$0")/lib/publish-release.sh"
#
# What differs between the two remotes is only the last step: the GitHub
# release object (which the release workflow builds the images from) and the
# Gitea one. Everything before that lives here, so the two scripts cannot
# drift apart.

# Defaults, overridden by the flags in parse_publish_args.
BRANCH="main"
VERSION_RAW=""
TAG=""
SKIP_CHECKS=0
HELP=0
REMAINING_ARGS=()
NOTES_FILE=""
TAG_CREATED=0

parse_publish_args() {
    while [ $# -gt 0 ]; do
        case "$1" in
            -h | --help) HELP=1; shift ;;
            --yes | -y) ASSUME_YES=1; shift ;;
            --dry-run) DRY_RUN=1; shift ;;
            --branch) BRANCH="${2:?--branch needs a value}"; shift 2 ;;
            --version) VERSION_RAW="${2:?--version needs a value}"; shift 2 ;;
            --skip-checks) SKIP_CHECKS=1; shift ;;
            *)
                REMAINING_ARGS+=("$1")
                shift
                ;;
        esac
    done

    DRY_RUN="${DRY_RUN:-0}"
    ASSUME_YES="${ASSUME_YES:-0}"
}

# Fails when the platform script was handed a flag it does not know.
reject_unknown_args() {
    local script="$1"
    if [ "${#REMAINING_ARGS[@]}" -eq 0 ]; then
        return 0
    fi
    printf 'Unknown argument: %s\n\n' "${REMAINING_ARGS[*]}" >&2
    "$script" --help >&2
    exit 2
}

# MARK:preflight
preflight() {
    local remote="$1"

    require_repo_root
    require_cmd git
    require_cmd "bun" "Install Bun: https://bun.sh"

    step "Checking the checkout"
    require_clean_worktree
    ok "The working tree has nothing uncommitted."
    require_on_branch "$BRANCH"
    ok "On $BRANCH."
    require_remote "$remote"
    ok "Remote '$remote' is $(git remote get-url "$remote")."
    require_not_behind "$remote" "$BRANCH"
    ok "$remote/$BRANCH has nothing HEAD is missing."
}
# END:preflight

# MARK:resolve-version
# Sets TAG (vX.Y.Z) from --version, else from package.json.
resolve_version() {
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
    ok "Releasing $TAG."

    if [ "$TAG" != "v$(source_version)" ]; then
        warn "package.json says $(source_version) but the release is $TAG. Bump package.json's version with the release so a dev build reports the same number (RELEASING.md, step 5)."
    fi
}
# END:resolve-version

# MARK:checks
# The release gate from RELEASING.md that a machine can check.
run_release_checks() {
    if [ "$SKIP_CHECKS" = "1" ]; then
        warn "Skipping typecheck, tests and the installer syntax check (--skip-checks)."
        return 0
    fi

    step "Running the release checks"
    run bun run typecheck
    ok "Type-check passed."
    run bun run test
    ok "Tests passed."
    run bash -n install.sh
    ok "install.sh parses."
}
# END:checks

# MARK:tag
# Creates the tag at HEAD, or verifies the existing one is at HEAD.
prepare_tag() {
    step "Preparing the tag $TAG"

    if local_tag_exists "$TAG"; then
        local tagged
        tagged="$(git rev-list -n1 "$TAG")"
        if [ "$tagged" != "$(git rev-parse HEAD)" ]; then
            fail "Tag $TAG already exists on ${tagged:0:12}, not on HEAD ($(git rev-parse --short HEAD)). Publishing would ship the code that tag was made from. Move it with: git tag -f -a $TAG -m '$TAG'"
        fi
        ok "Tag $TAG already points at HEAD; reusing it."
        return 0
    fi

    run git tag -a "$TAG" -m "$TAG"
    if [ "$DRY_RUN" != "1" ]; then
        TAG_CREATED=1
    fi
    ok "Tagged HEAD as $TAG."
}
# END:tag

# MARK:notes-file
# Writes release_notes into NOTES_FILE, which the caller cleans up. The
# compare base is the host's /compare/ path; the tag range is added here,
# since only this side knows which tag came before (a bare /compare/ opens
# the host's default comparison rather than this release's).
build_compare_url() {
    local compare_base="$1"
    local from="$2"

    if [ -z "$from" ]; then
        printf '%s' "$compare_base"
        return 0
    fi
    printf '%s%s...%s' "$compare_base" "$from" "$TAG"
}

write_notes_file() {
    local compare_base="$1"
    local compare_url=""
    local from=""
    # A dry run makes no tag, so the notes are read up to HEAD instead.
    local to="$TAG"

    if ! local_tag_exists "$to"; then
        to="HEAD"
    fi

    from="$(previous_tag "$to")"

    if [ -n "$from" ]; then
        detail "Changes since $from."
    else
        detail "No earlier tag, so every commit is listed."
    fi

    compare_url="$(build_compare_url "$compare_base" "$from")"

    NOTES_FILE="$(mktemp -t cobble-release-notes.XXXXXX)"
    release_notes --from "$from" --to "$to" --compare-url "$compare_url" >"$NOTES_FILE"
    ok "Wrote the release notes to $NOTES_FILE."
}

cleanup_notes() {
    if [ -n "$NOTES_FILE" ] && [ -f "$NOTES_FILE" ]; then
        rm -f "$NOTES_FILE"
    fi
}
# END:notes-file

# MARK:push
# Pushes the branch, then the tag. A tag the remote already has is left alone,
# so a rerun after a failed release object finishes the job instead of
# failing on the push.
push_branch_and_tag() {
    local remote="$1"

    step "Pushing to $remote"
    run git push "$remote" "$BRANCH"
    ok "Pushed $BRANCH."

    if [ -n "$(remote_tag_exists "$remote" "$TAG")" ]; then
        ok "$remote already has $TAG; not pushing it again."
        return 0
    fi
    run git push "$remote" "refs/tags/$TAG"
    ok "Pushed $TAG."
}
# END:push

# MARK:reuse-release
# A release object that already exists is left as it is, so rerunning the
# script never fails on it and never overwrites a body someone edited.
release_already_exists() {
    local description="$1"
    warn "$description for $TAG already exists; leaving it untouched."
    warn "Delete it first if it needs to be recreated."
}
# END:reuse-release

print_release_summary() {
    local remote="$1"
    local branch="$2"
    local release_url="$3"

    step "Published $TAG"
    printf '    %sremote%s   %s\n' "$C_DIM" "$C_RESET" "$remote ($(git remote get-url "$remote"))"
    printf '    %sbranch%s   %s\n' "$C_DIM" "$C_RESET" "$branch"
    printf '    %stag%s      %s\n' "$C_DIM" "$C_RESET" "$TAG"
    if [ -n "$release_url" ]; then
        printf '    %srelease%s  %s\n' "$C_DIM" "$C_RESET" "$release_url"
    fi
    if [ "$DRY_RUN" = "1" ]; then
        printf '\n%sDry run: nothing was tagged, pushed or published.%s\n' "$C_YELLOW" "$C_RESET"
    fi
}
