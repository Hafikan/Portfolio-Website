# Multi-stage build for the Next.js 16 portfolio.
#
# Deliberately uses only classic Dockerfile syntax (no BuildKit-only cache
# mounts) so it builds identically with or without the buildx plugin — the
# target server may not have it installed.
#
# Layout note: this app is *stateful*. The admin panel writes JSON registries to
# src/data/ and uploaded images to public/uploads/ (see src/lib/localData.ts and
# src/app/api/upload/route.ts), both resolved from process.cwd() at request time.
# Those two paths are mounted as volumes at runtime; the image only ships the
# seed copies under /app/seed.

ARG NODE_VERSION=24-alpine


# ---------------------------------------------------------------------------
# base — shared settings for every stage
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1


# ---------------------------------------------------------------------------
# deps — install node_modules from the lockfile only
#
# Kept separate so dependency installation is cached and only reruns when
# package.json / package-lock.json change, not on every source edit.
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund


# ---------------------------------------------------------------------------
# builder — compile the app
# ---------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next build reads NODE_ENV; set it explicitly so the production branch is taken.
ENV NODE_ENV=production
RUN npm run build


# ---------------------------------------------------------------------------
# runner — minimal production image
# ---------------------------------------------------------------------------
FROM base AS runner

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Runs as the unprivileged "node" user (uid/gid 1000) that node:alpine already
# ships — see USER below. The uid is referenced by the tmpfs mount options in
# docker-compose.yml.
#
# dumb-init reaps zombies and forwards SIGTERM/SIGINT to the server, so
# `docker stop` shuts Next down cleanly instead of waiting out the 10s timeout.
RUN apk add --no-cache dumb-init

# The standalone server.js serves ./public and ./.next/static itself, but the
# build does not copy them — see next docs, output.md ("Automatically Copying
# Traced Files"). Copy them in explicitly.
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Default JSON registries. These are *seeds*: the entrypoint copies any that are
# missing into the mounted volume, so a fresh deploy starts with valid content
# and an existing deploy is never overwritten.
COPY --from=builder --chown=node:node /app/src/data ./seed/data

# Writable mount points, pre-created with the right ownership. Docker copies this
# ownership onto a named volume when it initialises it — without this the volume
# would come up root-owned and the non-root process could not write to it.
RUN mkdir -p /app/src/data /app/public/uploads /app/.next/cache \
 && chown -R node:node /app/src /app/public/uploads /app/.next/cache

COPY --chown=node:node docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh

USER node

EXPOSE 3000

# Health probe hits a cheap JSON route rather than rendering the full page.
# Binds to 127.0.0.1 so the check never depends on outside network reachability.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:3000/api/config || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
