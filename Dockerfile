# syntax=docker/dockerfile:1
# Production image for the COE 3D-print booking app.
# Multi-stage: install → build (standalone) → minimal runtime.
# Requires next.config.mjs `output: "standalone"`.

# ---------- deps ----------
FROM node:20-bookworm-slim AS deps
WORKDIR /app
# openssl is needed by Prisma at build & runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `build` runs `prisma generate && next build`; standalone output is emitted to .next/standalone
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

# Standalone server bundle + static assets + public dir.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

# Prisma needs the schema + generated client + the migration SQL to run `migrate deploy`
# on startup. The generated client is already inside the standalone node_modules copy;
# we additionally carry the prisma dir and the CLI for migrations.
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/prisma ./node_modules/prisma
COPY --from=build /app/node_modules/.bin/prisma ./node_modules/.bin/prisma

USER nextjs
EXPOSE 3000
# server.js is the standalone entrypoint Next emits.
CMD ["node", "server.js"]
