# Cobble

[![CI](https://github.com/Moduletrace/cobble/actions/workflows/ci.yml/badge.svg)](https://github.com/Moduletrace/cobble/actions/workflows/ci.yml)

A self-hosted crew of small AI worker bots.

Cobble gives you a coordinator bot and a crew of workers, each with its own
job, models, memory and workspace. The crew talks to you in a chat, shares
workspaces, runs routines on a schedule, and drives its own computers:
Docker sandboxes with a browser, terminal, code editor and desktop that a
bot can use and hand back to you when it needs help.

It is an install, not a SaaS. One SQLite database, one Docker container, and
your data on your own machine.

- Website: [cobble.moduletrace.org](https://cobble.moduletrace.org)
- Source: [GitHub](https://github.com/Moduletrace/cobble) and [Gitea](https://git.tben.me/Moduletrace/cobble)
- License: MIT

## Install

On a Linux machine with Docker (the installer adds Docker when it is
missing):

```bash
curl -fsSL https://raw.githubusercontent.com/moduletrace/cobble/main/install.sh | sudo bash
```

Open the address it prints, usually `http://<your-ip>:7227`, and create the
super admin account. The first signup also creates the coordinator and the
main computer, which pulls the sandbox image in the background. Give it a
few minutes.

Then open **Settings > Models**, add an OpenRouter key (or another provider)
and wait for the model list to sync. This is what the bots think with.

### Requirements

- Linux amd64 or arm64, with Docker. The installer installs Docker from
  get.docker.com when it is missing.
- 2 CPU cores, 8 GB RAM and 20 GB free disk for the app plus one computer.
  Each computer is its own container with its own memory limit.
- Docker Desktop on macOS works for development and small installs, but
  Linux is the supported host.
- Port 7227, or another port with `--port`.
- HTTPS in front of the app before you expose it to the internet. Web Push
  and installable PWA features need it. A Cloudflare Tunnel or Caddy in
  front of `127.0.0.1:7227` is enough.

The installer binds to `0.0.0.0` so the app is reachable from your phone on
the same network. Use `--bind 127.0.0.1` when a reverse proxy is the only
thing that should reach it.

## Update and uninstall

The same script is the updater. It keeps the database, media, computers'
home directories and generated secrets, backs up the database before
replacing the container, and does nothing when the image has not changed.

```bash
curl -fsSL https://raw.githubusercontent.com/moduletrace/cobble/main/install.sh | sudo bash
```

```bash
# Stop the app and keep the data
curl -fsSL https://raw.githubusercontent.com/moduletrace/cobble/main/install.sh | sudo bash -s -- --uninstall

# Stop the app and delete the data
curl -fsSL https://raw.githubusercontent.com/moduletrace/cobble/main/install.sh | sudo bash -s -- --uninstall --purge
```

### Options

| Option                | Meaning                                                        |
| --------------------- | -------------------------------------------------------------- |
| `--home DIR`          | Install directory, default `/opt/cobble`                       |
| `--data-dir DIR`      | Data directory mounted at `/data`, default `HOME/data`         |
| `--port PORT`         | Host port, default `7227`                                      |
| `--bind ADDRESS`      | Host address to publish on, default `0.0.0.0`                  |
| `--image IMAGE`       | Container image, default `ghcr.io/moduletrace/cobble`          |
| `--version TAG`       | Image tag, default `latest`                                    |
| `--extra-network NET` | Join another Docker network, for a tunnel or reverse proxy     |
| `--force`             | Recreate the container even when it is current                 |
| `--no-pull`           | Use an image that is already on the machine                    |
| `--skip-backup`       | Update without a database backup                               |
| `--no-docker-install` | Fail instead of installing Docker                              |
| `--uninstall`         | Stop and remove the app container                              |
| `--purge`             | With `--uninstall`, also delete the data directory             |

## Data and settings

Everything that must survive an update lives under the install directory:

```
/opt/cobble/
  .env                  # generated once, mode 600
  install.conf          # installer state
  backups/              # pre-update database snapshots
  data/
    db/cobble
    db/.backups/
    media/
    computers/<id>/     # each computer's home directory
```

`.env` holds the port and the encryption keys. The keys encrypt sessions and
settings, so keep a copy and do not rotate them without re-entering provider
keys and other secrets. Provider keys, MCP servers, tools and app settings
are managed in the app, not in `.env`.

Edit `.env` and run `docker restart cobble` to apply changes. The installer
only appends missing values and keeps what is already there.

The app container is started with the Docker socket mounted and
`MAIN_SERVER=1`, so it can create computer containers and run cron, the
queue and Web Push.

## Images

Every release publishes a multi-arch image to both registries:

- `ghcr.io/moduletrace/cobble`
- `git.tben.me/moduletrace/cobble`

Tags are `latest`, the release version, `major.minor` and the commit sha.
Install from Gitea with
`--image git.tben.me/moduletrace/cobble`, or build from source with
`docker build -t cobble:local .` and `--image cobble --version local --no-pull`.

## Development

```bash
cp .env.example .env
# set ENCRYPTION_KEY and ENCRYPTION_SALT (openssl rand -hex 32)
bun install
bun run db:schema
bun run dev
```

Open `http://localhost:7227`. With no users, every page goes to
`/auth/signup` to create the super admin. For a headless setup:

```bash
SEED_SUPER_ADMIN_PASSWORD=... bun run seed
```

| Command              | Purpose                              |
| -------------------- | ------------------------------------ |
| `bun run dev`        | Development server                   |
| `bun run start`      | Production server on the host        |
| `bun run typecheck`  | Type-check                           |
| `bun run test`       | Run the test suite                   |
| `bun run seed`       | Create the super admin from the CLI  |
| `bun run seed:bots`  | Add a sample crew                    |
| `bun run db:schema`   | Sync the schema and types           |
| `bun run gen:favicon` | Regenerate favicons and PWA assets  |

The app is Bun, [`@moduletrace/bunext`](https://github.com/Moduletrace/bunext),
SQLite via [`@moduletrace/bun-sqlite`](https://github.com/Moduletrace/bun-sqlite),
Tailwind CSS and the `@moduletrace/twui` component library. See
[AGENTS.md](AGENTS.md) for the full architecture, routes, queue, harness and
data model.

CI runs type-check and tests on every push and pull request. Releases are
built by GitHub Actions and pushed to both registries. See
[RELEASING.md](RELEASING.md) for the release and launch checklist.

## License

MIT. See [LICENSE](LICENSE).
