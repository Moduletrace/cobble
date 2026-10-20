# Releasing Cobble

Cobble ships as a multi-arch container image and a single `install.sh`.
The repository starts private and is made public at the launch gate below.

## One-time setup

- [ ] `GITEA_USERNAME` and `GITEA_TOKEN` are set as GitHub Actions secrets.
      The token needs package write on the Gitea `Moduletrace` org.
- [ ] The Gitea repository exists at `git.tben.me/Moduletrace/cobble` and
      `main` is pushed to both remotes.
- [ ] The GHCR package is made public after the first image push
      (Settings > Packages > cobble > Change visibility).
- [ ] The Gitea package needs nothing: package visibility follows the
      public `Moduletrace` org.

## Every release

1. [ ] `bun run typecheck` and `bun run test` pass locally.
2. [ ] CI is green on `main` in GitHub Actions.
3. [ ] `bash -n install.sh` passes.
4. [ ] Test the installer on a clean machine, both amd64 and arm64 when
       possible:
       - fresh install, signup, one chat reply
       - rerun with no changes: reports up to date, no restart
       - update to a new tag: backup taken, data intact
       - `--uninstall` keeps data, `--uninstall --purge` removes it
5. [ ] Update the version if the release changes it.
6. [ ] Tag and publish a GitHub release:

       git tag v0.1.0
       git push origin main --tags
       gh release create v0.1.0 --title v0.1.0 --generate-notes

7. [ ] The release workflow builds `linux/amd64` and `linux/arm64` and
       pushes to both registries:
       - `ghcr.io/moduletrace/cobble`
       - `git.tben.me/moduletrace/cobble`
8. [ ] Check the manifests:

       docker buildx imagetools inspect ghcr.io/moduletrace/cobble:latest
       docker buildx imagetools inspect git.tben.me/moduletrace/cobble:latest

9. [ ] Confirm the GHCR package is public and pull it anonymously.
10. [ ] Push the tag to Gitea as well:

        git push gitea main --tags

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
- [ ] DNS and the reverse proxy or tunnel point at the container.

## Rollback

- Images are tagged with the release version, so an older tag can be
  installed with `--version vX.Y.Z`.
- The installer keeps the last five database backups in
  `$COBBLE_HOME/backups`.
- Restore a backup from **Settings > Backups** in the app, or restore the
  files with the app stopped.
