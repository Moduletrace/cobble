#!/usr/bin/env bash
# Publishes a Cobble release to GitHub.
#
#   scripts/publish-github.sh
#
# Runs the release gate from RELEASING.md (clean tree, typecheck, tests,
# installer syntax), tags HEAD with the package.json version, pushes main and
# the tag to the `origin` remote, then creates the GitHub release. Publishing
# that release is what fires .github/workflows/release.yml, which builds the
# multi-arch image and pushes it to GHCR (and mirrors it to Gitea).
#
# Run scripts/publish-gitea.sh afterwards for the source mirror's own release
# object. There is no existing publish script in the repo: this and its Gitea
# twin are it.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/publish-common.sh
. "$SCRIPT_DIR/lib/publish-common.sh"
# shellcheck source=lib/publish-release.sh
. "$SCRIPT_DIR/lib/publish-release.sh"

REMOTE="origin"

usage() {
    cat <<EOF
Publishes a Cobble release to GitHub.

Usage: scripts/publish-github.sh [options]

Options:
  --version VERSION   Version to release, with or without the leading v.
                      Defaults to package.json's version.
  --branch NAME       Branch to publish from (default: main).
  --yes, -y           Do not prompt.
  --dry-run           Print what would run, change nothing locally or remotely.
  --skip-checks       Skip typecheck, tests and the install.sh syntax check.
  -h, --help          Show this help.

The release object is created with the commit log since the previous tag as
its body, and marked latest on GitHub. The tag is pushed before the release
is created, so a rerun after a failure finishes the job.

Environment:
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

require_cmd gh "Install the GitHub CLI: https://cli.github.com"

preflight "$REMOTE"
resolve_version

remote_url="$(git remote get-url "$REMOTE")"
parse_remote_url "$remote_url"
COMPARE_URL="https://${REMOTE_HOST}/${REMOTE_OWNER}/${REMOTE_REPO}/compare/"

step "Checking the GitHub login"
if [ "$DRY_RUN" = "1" ]; then
    detail "[dry run] gh auth status"
else
    gh auth status >/dev/null 2>&1 || fail "The GitHub CLI is not logged in. Run: gh auth login"
    ok "gh is logged in."
fi

run_release_checks
prepare_tag
write_notes_file "$COMPARE_URL"

step "Publishing $TAG to GitHub ($REMOTE_OWNER/$REMOTE_REPO)"
printf '    %sremote%s  %s\n' "$C_DIM" "$C_RESET" "$remote_url"
printf '    %snotes%s   %s\n' "$C_DIM" "$C_RESET" "$NOTES_FILE"
confirm "Publish $TAG to GitHub and start the image build?"

push_branch_and_tag "$REMOTE"

if gh release view "$TAG" -R "$REMOTE_OWNER/$REMOTE_REPO" >/dev/null 2>&1; then
    release_already_exists "The GitHub release"
else
    # Publishing the release is what starts the image build.
    run gh release create "$TAG" \
        --repo "$REMOTE_OWNER/$REMOTE_REPO" \
        --title "$TAG" \
        --notes-file "$NOTES_FILE" \
        --target "$BRANCH" \
        --latest
    ok "Created the GitHub release; the release workflow is building the images."
fi

print_release_summary "$REMOTE" "$BRANCH" "https://github.com/${REMOTE_OWNER}/${REMOTE_REPO}/releases/tag/$TAG"
printf '\nThe release workflow builds and pushes the images; follow it with:\n    gh run watch\n'
