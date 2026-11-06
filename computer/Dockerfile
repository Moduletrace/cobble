# syntax=docker/dockerfile:1
#
# A Cobble computer: a real, headful browser on a virtual screen, plus a
# shell, in one lean Debian 13 container. The app reaches everything on one
# port (8080) through the agent in agent/:
#
#   /api/...     shell and files
#   /mcp         Playwright MCP, attached to the browser over CDP
#   /desktop/    the screen itself (noVNC over the agent's own websocket
#                bridge to Xvnc): the whole Chrome window, tabs and menus
#   /terminal/   a shell in the browser (ttyd)
#
# Google Chrome on amd64 (the real "Google Chrome" brand, Widevine, full
# codecs); Google ships no Linux arm64 build, so arm64 gets Debian's
# Chromium. Chrome never auto-updates in here: rebuild the image instead.
#
# DEBIAN_MIRROR (a build arg, e.g. http://cdn-aws.deb.debian.org/debian)
# fetches Debian's packages from another mirror when deb.debian.org is slow
# from where the image is built; the image is the same either way.

# --- The agent, bundled for Node -----------------------------------------------
FROM oven/bun:1.4.3-debian AS agent
WORKDIR /build
COPY agent ./agent
RUN bun build agent/main.ts --target=node --format=esm --outfile=dist/agent.mjs

# --- noVNC, the screen's viewer: the project's release, checked against its
# hash (Debian's package pulls websockify and numpy, which the agent's own
# bridge makes unneeded). It connects by itself, reconnects, and scales the
# screen to its frame; its socket is fixed to the agent's. novnc/ adds
# clipboard sync (Ctrl+V pastes what the user copied).
FROM debian:trixie-slim AS novnc
ARG NOVNC_VERSION=1.6.0
ARG NOVNC_SHA256=5066103959ef4e9b10f37e5a148627360dd8414e4cf8a7db92bdbd022e728aaa
ARG DEBIAN_MIRROR
RUN if [ -n "$DEBIAN_MIRROR" ]; then sed -i "s|http://deb.debian.org/debian|$DEBIAN_MIRROR|g" /etc/apt/sources.list.d/debian.sources; fi \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && curl -fsSL -o /tmp/novnc.tgz "https://github.com/novnc/noVNC/archive/refs/tags/v${NOVNC_VERSION}.tar.gz" \
    && echo "${NOVNC_SHA256}  /tmp/novnc.tgz" | sha256sum -c - \
    && mkdir -p /opt/novnc \
    && tar xzf /tmp/novnc.tgz -C /opt/novnc --strip-components=1 \
    && cd /opt/novnc \
    && rm -rf tests docs snap utils po .github karma.conf.cjs eslint.config.mjs \
    && echo '{"autoconnect":true,"reconnect":true,"reconnect_delay":1000,"resize":"scale"}' > defaults.json \
    && echo '{"host":"","port":0,"path":"websockify"}' > mandatory.json
COPY novnc/cobble-clipboard.js /opt/novnc/cobble-clipboard.js
RUN grep -q '</head>' /opt/novnc/vnc.html \
    && sed -i 's|</head>|    <script type="module" src="./cobble-clipboard.js"></script>\n</head>|' /opt/novnc/vnc.html \
    && grep -q cobble-clipboard /opt/novnc/vnc.html

# --- Playwright MCP, installed once (no npm in the final image) ------------------
FROM debian:trixie-slim AS mcp
ARG PLAYWRIGHT_MCP_VERSION=0.0.84
ARG DEBIAN_MIRROR
RUN if [ -n "$DEBIAN_MIRROR" ]; then sed -i "s|http://deb.debian.org/debian|$DEBIAN_MIRROR|g" /etc/apt/sources.list.d/debian.sources; fi \
    && apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates nodejs npm \
    && npm install --prefix /opt/playwright-mcp --omit=dev --no-audit --no-fund "@playwright/mcp@${PLAYWRIGHT_MCP_VERSION}" \
    && /opt/playwright-mcp/node_modules/.bin/playwright-mcp --version

# --- The computer ----------------------------------------------------------------
FROM debian:trixie-slim
ARG TARGETARCH

LABEL org.opencontainers.image.title="Cobble computer" \
      org.opencontainers.image.description="A Cobble bot's computer: a real headful browser and a shell." \
      org.opencontainers.image.source="https://github.com/Moduletrace/cobble" \
      org.opencontainers.image.licenses="MIT"

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    TZ=UTC \
    PIP_BREAK_SYSTEM_PACKAGES=1

ARG DEBIAN_MIRROR
RUN if [ -n "$DEBIAN_MIRROR" ]; then sed -i "s|http://deb.debian.org/debian|$DEBIAN_MIRROR|g" /etc/apt/sources.list.d/debian.sources; fi \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        # What bots reach for on a shell; anything else the coordinator
        # installs (worker bots have no sudo).
        bash ca-certificates curl wget git jq less nano procps psmisc sudo \
        unzip zip xz-utils file openssh-client tzdata tini \
        # Worker bots' own accounts: their folders shared with gem through
        # ACLs, and kept off the services on loopback by nftables.
        acl nftables \
        python3 python3-pip python3-venv nodejs \
        # The notification watcher (Python + GLib on the session bus).
        python3-gi gir1.2-glib-2.0 dbus-daemon dbus-session-bus-common \
        # The screen (Xvnc: an X server that is also a VNC server, on
        # loopback), and Mesa so WebGL runs without a GPU.
        tigervnc-standalone-server libgl1-mesa-dri libegl1 libgles2 \
        # The fonts a normal desktop install ships.
        fonts-dejavu fonts-liberation fonts-liberation2 fonts-noto-core \
        fonts-noto-cjk fonts-noto-color-emoji fonts-noto-mono fonts-noto-ui-core \
        fonts-cantarell fonts-urw-base35 \
        libu2f-udev xdg-utils \
    && if [ "$TARGETARCH" = "amd64" ]; then \
        curl -fsSL https://dl.google.com/linux/linux_signing_key.pub -o /usr/share/keyrings/google-chrome.asc \
        && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.asc] https://dl.google.com/linux/chrome/deb/ stable main" \
            > /etc/apt/sources.list.d/google-chrome.list \
        && apt-get update \
        && apt-get install -y --no-install-recommends google-chrome-stable \
        && google-chrome-stable --version; \
    else \
        apt-get install -y --no-install-recommends chromium \
        && chromium --version; \
    fi \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/* /var/tmp/* /tmp/* /usr/share/doc/* /usr/share/man/*

# The Shell view: ttyd, a terminal in the browser (Debian 13 doesn't package
# it), the project's static build, checked against its published hashes.
ARG TTYD_VERSION=1.7.7
RUN set -eu; \
    case "$TARGETARCH" in \
        amd64) arch=x86_64; sum=8a217c968aba172e0dbf3f34447218dc015bc4d5e59bf51db2f2cd12b7be4f55 ;; \
        arm64) arch=aarch64; sum=b38acadd89d1d396a0f5649aa52c539edbad07f4bc7348b27b4f4b7219dd4165 ;; \
        *) echo "No ttyd build for $TARGETARCH" >&2; exit 1 ;; \
    esac; \
    curl -fsSL -o /usr/local/bin/ttyd "https://github.com/tsl0922/ttyd/releases/download/${TTYD_VERSION}/ttyd.${arch}"; \
    echo "${sum}  /usr/local/bin/ttyd" | sha256sum -c -; \
    chmod 755 /usr/local/bin/ttyd; \
    ttyd --version

# The computer's user, with sudo: the services run as it, and so does the
# coordinator, which installs what worker bots ask for (it's lost when the
# container is recreated). Worker bots get accounts of their own, without
# sudo, made by the agent. Chrome and Chromium read managed policies (the
# app's default extensions) from the same folder. nft is only looked for,
# never run: it opens a netlink socket even for --version, which an
# emulated (arm64 on amd64) build doesn't have.
RUN setpriv --version && setfacl --version && command -v nft \
    && useradd --create-home --uid 1000 --shell /bin/bash gem \
    && echo 'gem ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/gem \
    && chmod 440 /etc/sudoers.d/gem \
    && mkdir -p /home/gem/workspace /home/gem/.cobble-browser /etc/opt/chrome/policies/managed /etc/chromium \
    && rm -rf /etc/chromium/policies \
    && ln -s /etc/opt/chrome/policies /etc/chromium/policies \
    && chown -R gem:gem /home/gem

COPY --from=mcp /opt/playwright-mcp /opt/playwright-mcp
COPY --from=agent /build/dist /opt/cobble-agent
COPY --from=novnc /opt/novnc /opt/novnc

EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -fsS -o /dev/null http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--", "node", "/opt/cobble-agent/agent.mjs"]
