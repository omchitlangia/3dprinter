#!/bin/bash
set -e
cd /home/om/coe3d-src
git pull
docker build \
  --build-arg NPM_REGISTRY=https://registry.npmmirror.com/ \
  --build-arg PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma \
  -t coe3d-coe3d-app .
docker tag coe3d-coe3d-app coe3d-app
docker tag coe3d-coe3d-app coe3d-migrate
cd /home/om/coe3d-src/deploy
docker compose --env-file ../.env -f docker-compose.yml up -d --no-build
echo "Deploy done."
