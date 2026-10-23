# Releasing Cobble

Cobble ships as a multi-arch container image and a single `install.sh`.
The repository starts private and is made public at the launch gate below.

Cobble is in **alpha** (see the note in `README.md`). Every release published
before v1.0.0 is an alpha release: interfaces, the database schema and the
settings may change between them, so a release that needs a migration step
has to say so in its notes, and Settings > General keeps saying the stage
until v1.0.0.

## One-time setup

- [ ] `GITEA_USERNAME` and `GITEA_TOKEN` are set as GitHub Actions secrets.
      The token needs package write on the Gitea `Moduletrace` org.
- [ ] `scripts/publish-gitea.sh` can reach Gitea: either `GITEA_TOKEN` is
      exported locally, or `tea login add` has been run for the host (the
      script then reads the token from `~/.config/tea/config.yml`). It needs
      `write:repository` on the repository to create the release.
- [ ] `scripts/publish-github.sh` can publish releases: `gh auth login` has
      been run, and the token has `repo` scope.
- [ ] The Gitea repository exists at `git.tben.me/Moduletrace/cobble` and
      `main` is pushed to both remotes.
- [ ] The GHCR package is made public after the first image push
      (Settings > Packages > cobble > Change visibility).
- [ ] The Gitea package needs nothing: package visibility follows the
      public `Moduletrace` org.

## Every release

The two publish scripts below do steps 1 to 3, 6 and 10 for you: they run the
same checks, tag `HEAD` with `package.json`'s version, push `main` and the tag,
and create the release object. Everything else is still hand work.

`scripts/publish-github.sh` publishes to GitHub and, by publishing the
release, starts the image build. `scripts/publish-gitea.sh` publishes the same
release to the Gitea mirror. Both accept `--version VERSION` (defaulting to
`package.json`), `--branch`, `--yes`, `--dry-run` and `--skip-checks`; run
them in that order, since only the GitHub release builds images.

1. [ ] `bun run typecheck` and `bun run test` pass locally.
2. [ ] CI is green on `main` in GitHub Actions.
3. [ ] `bash -n install.sh` passes.
4. [ ] Test the installer on a clean machine, both amd64 and arm64 when
       possible:
       - fresh install, signup, one chat reply
       - rerun with no changes: reports up to date, no restart
       - update to a new tag: backup taken, data intact
       - `--uninstall` keeps data, `--uninstall --purge` removes it
5. [ ] Update the version if the release changes it, including
       `package.json`'s `version` (the image reports it on Settings > General
       when it isn't built from a release tag, and the publish scripts tag
       with it).
6. [ ] Tag and publish a GitHub release:

       scripts/publish-github.sh                 # or: bun run publish:github

       # by hand, the script does this:
       git tag -a v0.1.0 -m v0.1.0
       git push origin main
       git push origin refs/tags/v0.1.0
       gh release create v0.1.0 --title v0.1.0 --notes-file notes.md --latest

7. [ ] The release workflow builds `linux/amd64` and `linux/arm64` and
       pushes to both registries:
       - `ghcr.io/moduletrace/cobble`
       - `git.tben.me/moduletrace/cobble`
8. [ ] Check the manifests:

       docker buildx imagetools inspect ghcr.io/moduletrace/cobble:latest
       docker buildx imagetools inspect git.tben.me/moduletrace/cobble:latest

9. [ ] Confirm the GHCR package is public and pull it anonymously.
10. [ ] Publish the release to Gitea as well:

        scripts/publish-gitea.sh                  # or: bun run publish:gitea

        # by hand, the script does this:
        git push gitea main
        git push gitea refs/tags/v0.1.0

11. [ ] Update every install with the one-liner:

        curl -fsSL https://url.moduletrace.com/cobble | sudo bash

## Launch gate

Before the first public release:

- [ ] `LICENSE`, `README.md` and `RELEASING.md` are in place.
- [ ] The installer has been tested on a clean amd64 and a clean arm64 host.
- [ ] No secrets are tracked (`git status`, `git ls-files`, secret scanning).
- [ ] The GitHub repository and the Gitea mirror are set to public.
- [ ] The GHCR package is public.
- [ ] The first release is installed on the real host and a signup, a chat
      reply, a computer and a routine have been exercised.
- [ ] A plain `curl | bash` install answers on `http://<host>:7227`, and
      the same install behind a reverse proxy serves HTTPS, installs the
      app, gets a live chat socket and can turn on notifications.

## Rollback

- Images are tagged with the release version, so an older tag can be
  installed with `--version vX.Y.Z`.
- The installer keeps the last five database backups in
  `$COBBLE_HOME/backups`. Whole-data archives from Settings > Backups live
  in `$COBBLE_HOME/backups-archives`; they are kept, not pruned by the
  installer.
- Restore a backup from **Settings > Backups** in the app: a database
  snapshot, or a whole-data archive (which replaces every folder, the
  snapshots included, takes a safety archive first and restarts the app).
  A snapshot can also be restored with the app stopped.
