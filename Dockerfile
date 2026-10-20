FROM oven/bun:1.4.3-debian

LABEL org.opencontainers.image.title="Cobble" \
      org.opencontainers.image.description="A self-hosted crew of small AI worker bots." \
      org.opencontainers.image.source="https://github.com/Moduletrace/cobble" \
      org.opencontainers.image.licenses="MIT"

# openssl generates the local CA and certificate the installer serves HTTPS
# with (`src/scripts/generate-local-certs.ts`).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl bash nano wget zip unzip openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
# Everything that must survive an update lives on the /data volume:
# the database, media, computers' home directories
ENV DATA_DIR=/data
ENV DB_DIR=/data/db
ENV BUN_FEATURE_FLAG_DISABLE_STREAMING_INSTALL=1

WORKDIR /app

RUN echo 'alias ll="ls -laF"' >/root/.bashrc

COPY package.json bun.lock ./
# Local packages the lockfile installs from (`file:` dependencies)
COPY packages ./packages
RUN bun install --frozen-lockfile

COPY . /app/.

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD if [ -n "$TLS_CERT_FILE" ]; then curl -fsSk "https://localhost:${PORT:-7227}/api/health" || exit 1; else curl -fsS "http://localhost:${PORT:-7227}/api/health" || exit 1; fi

ENTRYPOINT ["/entrypoint.sh"]
