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
curl -fsSL https://url.moduletrace.com/cobble | sudo bash
```

HTTPS is on by default, and a fresh install asks before continuing: it
encrypts the connection, and phones need it to install the app and receive
notifications. The installer creates a local CA for the machine, so each
device trusts it once. Answer no, or pass `--no-https`, if a proxy or tunnel
already handles HTTPS; `--yes` accepts the default without asking. Updates
keep the mode already chosen.

Open the address it prints, usually `https://<your-ip>:7227`. The
certificate is signed by a local CA the installer made, so the browser warns
until you trust it: open `https://<your-ip>:7227/ca.crt` on the device and
install it (see [HTTPS](#https)), then reload and create the super admin
account. The first signup also creates the coordinator and the main
computer, which pulls the sandbox image in the background. Give it a few
minutes.

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
- HTTPS is on by default, with a certificate for this machine. Exposing the
  app publicly? Use `--https-cert` and `--https-key` with a real
  certificate, or `--no-https` behind a proxy or tunnel.

The installer binds to `0.0.0.0` so the app is reachable from your phone on
the same network. Use `--bind 127.0.0.1` when a reverse proxy is the only
thing that should reach it (with `--no-https`).

## HTTPS

The installer serves HTTPS by default, and a fresh install asks before
continuing (`--yes` skips the question, `--no-https` answers it, an update
keeps the saved mode). It generates a local CA and a certificate for this
machine into `$COBBLE_HOME/certs` and mounts them into the container read
only. The CA is kept across updates; the certificate is re-issued when the
machine's addresses change or it is within 30 days of expiring, and a rerun
of the updater does both.

Trust the CA once on each device. Until it is trusted the browser warns, and
the installed app, its service worker and Web Push stay off:

- **Download:** open `https://<this machine>:7227/ca.crt` on the device, or
  copy `$COBBLE_HOME/certs/ca.crt`.
- **iPhone or iPad:** open `https://<this machine>:7227/ca.mobileconfig`
  instead. iOS offers the profile in one tap; install it, then turn it on
  under Settings > General > About > Certificate Trust Settings.
- **Android:** Settings > Security > Encryption & credentials > Install a
  certificate > CA certificate.
- **macOS:** add it to the login keychain and set it to Always Trust.
- **Linux:** copy it into `/usr/local/share/ca-certificates/` and run
  `sudo update-ca-certificates`.

Options for the certificate:

- A VPN name or address the installer did not detect: `--https-host NAME`,
  repeatable.
- Your own certificate (a public CA, an internal CA, `tailscale cert`):
  `--https-cert FILE --https-key FILE`. Rerun the installer when it is
  renewed.
- Replace the local CA, for example after trusting the wrong one:
  `--https-regen`. Every device must trust the new CA.
- Plain HTTP with a proxy or tunnel in front: `--no-https`.
- Turn HTTPS back on after `--no-https`: `--https`.

## Update and uninstall

The same script is the updater. It keeps the database, media, computers'
home directories and generated secrets, backs up the database before
replacing the container, and does nothing when the image has not changed.

```bash
curl -fsSL https://url.moduletrace.com/cobble | sudo bash
```

```bash
# Stop the app and keep the data
curl -fsSL https://url.moduletrace.com/cobble | sudo bash -s -- --uninstall

# Stop the app and delete the data
curl -fsSL https://url.moduletrace.com/cobble | sudo bash -s -- --uninstall --purge
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
| `--no-https`          | Serve plain HTTP, for a proxy or tunnel in front               |
| `--https`             | Serve HTTPS again after `--no-https`                           |
| `--https-host VALUE`  | Names or IPs the certificate covers, repeatable                |
| `--https-cert FILE`   | Use your own certificate instead of the local CA               |
| `--https-key FILE`    | Its private key, given with `--https-cert`                     |
| `--https-regen`       | Replace the local CA and the certificate                       |
| `--force`             | Recreate the container even when it is current                 |
| `--no-pull`           | Use an image that is already on the machine                    |
| `--skip-backup`       | Update without a database backup                               |
| `--no-docker-install` | Fail instead of installing Docker                              |
| `--yes`, `-y`         | Accept the defaults without asking (HTTPS on)                  |
| `--uninstall`         | Stop and remove the app container                              |
| `--purge`             | With `--uninstall`, also delete the data directory             |

## Data and settings

Everything that must survive an update lives under the install directory:

```
/opt/cobble/
  .env                  # generated once, mode 600
  install.conf          # installer state
  backups/              # pre-update database snapshots
  certs/                # the local CA and the certificate (HTTPS)
  data/
    db/cobble
    db/.backups/
    media/
    computers/<id>/     # each computer's home directory
```

`.env` holds the port, the encryption keys and the `TLS_*` certificate
paths. The keys encrypt sessions and settings, so keep a copy and do not
rotate them without re-entering provider keys and other secrets. Provider
keys, MCP servers, tools and app settings are managed in the app, not in
`.env`.

Edit `.env` and run `docker restart cobble` to apply changes. The installer
only appends missing values and keeps what is already there, apart from the
port and the `TLS_*` entries it manages.

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

Open `http://localhost:7227`, or `https://localhost:7227` once `certs/`
exists. With no users, every page goes to `/auth/signup` to create the super
admin. For a headless setup:

```bash
SEED_SUPER_ADMIN_PASSWORD=... bun run seed
```

The development server reads the same `TLS_*` variables as the container, so
it can serve HTTPS too. That is how to try the app from a phone over a VPN,
where the secure context (installed app, Web Push, voice) needs it:

```bash
bun run dev:phone -- --host cobble-laptop.tailnet-name.ts.net
```

That generates `certs/` and starts the dev server with it, with no `.env`
edits. Afterwards any server, `bun run dev` or `bun run start`, reuses the
certificate whenever `certs/server.crt` and `certs/server.key` exist; set
`TLS_DISABLED=1` to serve plain HTTP instead. `bun run gen:certs` on its own
regenerates them if you need to add a name.

Open `https://<the name you passed>:7227` on the phone and install the CA
from `https://<the name you passed>:7227/ca.mobileconfig` first. On the
laptop, trust the same `certs/ca.crt` once, so `https://localhost:7227`
stops warning.

With a certificate the server also listens one port above (`7228`) for
plain HTTP and redirects to the HTTPS page, so a stray
`http://localhost:7228/...` link still lands. The HTTPS port itself cannot
answer plain HTTP, so `http://localhost:7227` still fails; use
`HTTP_REDIRECT_PORT` to move the redirect. The container publishes only the
HTTPS port, so the redirect is reachable there only if that second port is
published.

| Command              | Purpose                              |
| -------------------- | ------------------------------------ |
| `bun run dev`        | Development server                   |
| `bun run dev:phone`  | Dev server over HTTPS for a phone    |
| `bun run start`      | Production server on the host        |
| `bun run typecheck`  | Type-check                           |
| `bun run test`       | Run the test suite                   |
| `bun run seed`       | Create the super admin from the CLI  |
| `bun run seed:bots`  | Add a sample crew                    |
| `bun run db:schema`   | Sync the schema and types           |
| `bun run gen:favicon` | Regenerate favicons and PWA assets  |
| `bun run gen:certs`   | Generate a local HTTPS certificate  |

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
