# syntax=docker/dockerfile:1
# Production image for the COE 3D-print booking app.
# Multi-stage: install → build (standalone) → minimal runtime.
# Requires next.config.mjs `output: "standalone"`.
#
# Network note: if the build host cannot reach the public npm / Prisma servers
# (as on bullitt), pass a reachable mirror at build time, e.g.:
#   docker build \
#     --build-arg NPM_REGISTRY=https://registry.npmmirror.com/ \
#     --build-arg PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma \
#     -t coe3d-app .
# Integrity hashes in package-lock.json are verified regardless of the registry,
# so the mirror cannot substitute tampered bytes. Defaults are the official ones.

ARG NPM_REGISTRY=https://registry.npmjs.org/
ARG PRISMA_ENGINES_MIRROR=

# ---------- deps ----------
FROM node:20-bookworm-slim AS deps
ARG NPM_REGISTRY
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# npm ci installs EXACTLY from the lockfile and validates SHA-512 integrity.
RUN npm ci --registry="${NPM_REGISTRY}" --no-audit --no-fund

# ---------- build ----------
FROM node:20-bookworm-slim AS build
ARG PRISMA_ENGINES_MIRROR
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# If a Prisma engines mirror is supplied, use it (and ignore missing .sha256 on
# mirrors that don't host checksum sidecars).
ENV PRISMA_ENGINES_MIRROR=${PRISMA_ENGINES_MIRROR}
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
# `build` runs `prisma generate && next build`; standalone is emitted to .next/standalone.
RUN npm run build

# ---------- runtime ----------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/* \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Standalone server bundle (includes traced node_modules: prisma client,
# nodemailer, aws-sdk, …) + static assets + public dir.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# For `prisma migrate deploy` at deploy time (compose `migrate` service): carry
# the schema, the migration SQL, the Prisma CLI, and its engine binaries.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=build /app/node_modules/@prisma/engines ./node_modules/@prisma/engines

USER nextjs
EXPOSE 3000
# server.js is the standalone entrypoint Next emits.
CMD ["node", "server.js"]
