FROM oven/bun:1.3.14-debian

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl bash nano wget zip unzip \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV BUN_FEATURE_FLAG_DISABLE_STREAMING_INSTALL=1

WORKDIR /app

RUN echo 'alias ll="ls -laF"' >/root/.bashrc

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . /app/.

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT:-7227}/api/health" || exit 1

ENTRYPOINT ["/entrypoint.sh"]
