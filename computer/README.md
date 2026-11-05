# Cobble computer

The image every Cobble computer runs: a real, headful browser on a virtual
screen and a shell, in one lean Debian 13 (trixie) container. It replaces the
AIO sandbox, whose browser sites like Google turned away.

```
app ──http:8080──► agent ─┬─ /api/exec, /api/files/*  shell and files, as gem
                          ├─ /terminal/ ─► ttyd (a shell in the browser)
                          ├─ /mcp ─► Playwright MCP ──CDP 127.0.0.1:9222──► Google Chrome
                          └─ /desktop/ noVNC ──websocket──► VNC 127.0.0.1:5900     (headful)
                                                                 │                  │
                                                       Xvnc :99 (1920x1080) ◄───────┘
```

- **Browser:** Google Chrome on amd64 (the real "Google Chrome" Client Hints
  brand, Widevine, full codecs); Debian's Chromium on arm64, where Google
  ships no Linux build. It runs headful on Xvnc with a normal profile and no
  automation flags: the app attaches over CDP, it never launches it, so
  `navigator.webdriver` is false. WebGL runs on Mesa's software renderer.
- **Agent** (`agent/`): the container's main process (under tini). It keeps
  Xvnc, the session bus, Chrome, Playwright MCP and ttyd running (each restarted
  when it exits), stops them in order on `docker stop` so Chrome saves its
  profile, and serves the app on port 8080. Node, no dependencies; bundled by
  Bun when the image is built.
- **Screen** (`/desktop/`): the virtual screen itself, so Chrome shows as
  it is: its tab strip, address bar, menu, extensions, drop-downs and
  prompts. The screen is Xvnc (an X server that is also a VNC server, on
  loopback, no password); noVNC (the project's release, settings in its
  `defaults.json`/`mandatory.json`) draws it scaled to the window, and the
  agent bridges noVNC's websocket to Xvnc itself (no websockify). The
  screen's size is a setting; a viewer can't resize it. `novnc/cobble-clipboard.js`
  makes Ctrl/Cmd+V on the screen paste the viewer's clipboard (browsers allow
  that over HTTPS or localhost), and copies the computer's back.
- **Shell** (`/terminal/`): ttyd, a terminal in the browser, as `gem`.

No window manager, desktop or code editor: the image stays small and starts
fast. Bots
install what else they need with `sudo apt-get install -y` (lost when the
container is recreated).

## API

Every path but `/health` needs `Authorization: Bearer $COBBLE_COMPUTER_TOKEN`
when that's set (the app sets it per computer).

| Path | |
| --- | --- |
| `GET /health` | 200 once Chrome's DevTools and Playwright MCP answer |
| `GET /api/info` | home, workspace, user, browser binary and version |
| `POST /api/exec` | `{ command, timeout_seconds?, cwd? }`: one `bash -c` as `gem`, own process group, no stdin, killed with its children at the timeout or when the request goes away. `{ output, exit_code, timed_out, truncated }` |
| `GET /api/files/stat?path=` | `{ exists, type, size, mtime_ms }` |
| `GET /api/files/download?path=` | the bytes; the connection is cut if the file changes mid-send |
| `POST /api/files/write` | `{ path, content, encoding?: "utf8" \| "base64", mode? }`, owned by `gem` |
| `/mcp` | Playwright MCP (`--shared-browser-context --codegen none --no-webmcp --file-paths absolute`, its files in `~/.cobble/playwright`, capped at 256 MB); Chrome saves downloads in `~/Downloads` |
| `/desktop/` | the screen (noVNC); `/desktop/websockify` is its websocket to Xvnc |
| `/terminal/` | a shell in the browser (ttyd, as `gem`, in the workspace) |

## Settings

| Env | Default | |
| --- | --- | --- |
| `COBBLE_COMPUTER_TOKEN` | none (open) | the token the API asks for |
| `COBBLE_BROWSER_PROFILE_DIR` | `/home/gem/.cobble-browser` | Chrome's profile (mount it to keep logins) |
| `COBBLE_SCREEN` | `1920x1080` | the virtual screen, and the window that fills it |
| `COBBLE_BROWSER_SCALE` | `1.25` | how large Chrome draws pages (its device scale factor, 1 to 3): larger text in screenshots |
| `COBBLE_BROWSER_LANG`, `COBBLE_BROWSER_ACCEPT_LANG` | `en-US`, `en-US,en` | keep them, and `TZ`, matched to where the traffic comes from |
| `COBBLE_BROWSER_SANDBOX` | `true` | Chrome's sandbox; it's turned off by itself when the host blocks user namespaces |
| `COBBLE_BROWSER_ARGS` | | more Chrome flags, space separated (ones that would open DevTools or move the profile are dropped) |
| `COBBLE_MCP_ARGS` | | more Playwright MCP flags, e.g. `--caps vision` (where it listens and which browser it drives can't be changed) |
| `TZ` | `UTC` | the browser's timezone |

Chrome's sandbox needs user namespaces, so run the container with
`--security-opt seccomp=unconfined` (the app does), and a big `/dev/shm`
(`--shm-size 2g`).

## Building

The app runs the tag in `AppData.ComputerImage`
(`ghcr.io/moduletrace/cobble-computer:<version>`). Any change here bumps that
tag; the release workflow builds a tag once (a dispatch with
`rebuild_computer` rebuilds it, for a newer Chrome).

```sh
bun run build:computer          # builds AppData.ComputerImage for this machine
docker run -d --name cobble-computer-dev --shm-size 2g \
  --security-opt seccomp=unconfined -p 8170:8080 \
  ghcr.io/moduletrace/cobble-computer:1.0.0
```

A computer run by hand like that has no token, so anyone who reaches its port
drives its browser: bind it to localhost. Point a dev server at it with the
`MAIN_COMPUTER_URL` app setting (`http://localhost:8170`).

To bump Playwright MCP or ttyd, change `PLAYWRIGHT_MCP_VERSION` or `TTYD_VERSION` (and its two hashes) in the Dockerfile.

## Known limits

- **IP reputation matters more than the browser.** A data-center IP is
  flagged by Cloudflare and others however real the browser is.
- **No GPU:** WebGL reports Mesa llvmpipe, plausible for a Linux box.
- **Native popups aren't in the live view:** a drop-down opens as the view's
  own list; the browser's own menus and permission bubbles don't show (use
  `chrome://settings/content` in the address bar for site permissions).
- **Automation can still be noticed** by its behaviour (instant clicks, no
  mouse movement). When a challenge shows, take over and solve it; the bot
  carries on in the same session.

When deb.debian.org is slow from where you build, fetch Debian's packages from
another mirror (the image is the same):

```sh
bun run build:computer --build-arg DEBIAN_MIRROR=http://cdn-aws.deb.debian.org/debian
```
