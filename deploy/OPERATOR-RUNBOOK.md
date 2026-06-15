# Operator runbook — deploy COE 3D-print app on aitest1.snu.in (bullitt)

Everything here is run **as a user with sudo / docker access** on `bullitt`
(host `aicoe.snu.in`). The app code lives at `/home/om/coe3d-src`. The Claude
session that prepared this could NOT run these (no docker group, no sudo) — that
is the only reason these are manual.

`aitest1.snu.in` → `103.27.166.39` (A) + `2001:df2:1140:5::87` (AAAA). The A
record points at THIS box. **This will replace the current static site served
from `/var/www/aitest1`** with the booking app.

---

## STEP 1 — Grant docker access to `om` (so future runs don't need sudo)

```bash
sudo usermod -aG docker om
# om must log out and back in (or: `newgrp docker`) for this to take effect.
```

## STEP 2 — Bring up the private topology (Postgres + MinIO + app)

Both Postgres and MinIO stay PRIVATE: Postgres has no host port at all; MinIO and
the app bind to `127.0.0.1` only. The repo `.env` already has dummy creds that
pass `src/lib/env.ts` validation.

```bash
cd /home/om/coe3d-src/deploy
# Build images + start everything. Migrations + bucket creation run automatically.
docker compose --env-file ../.env -f docker-compose.yml up -d --build
# Watch it settle:
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml logs -f app    # ctrl-C once you see it listening
```

Expected after this:
- `coe3d-postgres-1`  healthy, no published port.
- `coe3d-minio-1`     up, published ONLY on `127.0.0.1:9000`.
- `coe3d-migrate-1`   exited 0 (applied `0001_init`).
- `coe3d-createbucket-1` exited 0 (created bucket `coe3d-models`).
- `coe3d-app-1`       up, published ONLY on `127.0.0.1:3000`.

Quick local sanity (still private, before touching Caddy):
```bash
curl -sI http://127.0.0.1:3000/ | head -1        # expect HTTP/1.1 200
curl -sI http://127.0.0.1:9000/minio/health/live # expect 200 from MinIO
```

## STEP 3 — Repoint aitest1.snu.in in the system Caddy

The new routing block is at `/home/om/coe3d-src/deploy/aitest1.Caddyfile`. It sends
`/coe3d-models/*` → MinIO (full path preserved) and everything else → the app.

```bash
# 3a. Back up the live Caddyfile first.
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%F-%H%M%S)

# 3b. Edit /etc/caddy/Caddyfile: find the existing `aitest1.snu.in { ... }` block
#     (currently a file_server rooted at /var/www/aitest1) and REPLACE that whole
#     block with the contents of deploy/aitest1.Caddyfile. Leave every OTHER site
#     block (aicoe, webui, aitest2, stockdash, ocr, lungrag, ...) untouched.
sudo nano /etc/caddy/Caddyfile     # or: sudoedit

# 3c. Validate before reloading — a bad config must NOT take down the other sites.
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

# 3d. Graceful reload (zero-downtime; only applies if validate passed).
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager | head -5
```

Caddy already has a valid cert for `aitest1.snu.in` (currently ZeroSSL via its ACME
setup), so no new issuance is needed; the reload keeps serving HTTPS.

## STEP 4 — Verify the public pipeline (run the bundled script)

```bash
cd /home/om/coe3d-src
# Uses the app's OWN presigned-URL code path; uploads via the public domain,
# downloads back, compares bytes; checks cron auth 401/200; checks /, /signin.
node deploy/verify-public.mjs
```

It cleans up its test object on success. A green run proves single-domain routing,
path-style addressing, and the cron gate end-to-end.

---

## Swapping in REAL credentials later (no rebuild of the topology needed)

Edit `/home/om/coe3d-src/.env`, replace the dummy values (see
"INPUTS STILL REQUIRED" in the verification report), then:

```bash
cd /home/om/coe3d-src/deploy
docker compose -f docker-compose.yml up -d --build app   # picks up new .env
```

Register the Google OAuth **Authorized redirect URI** exactly as:
`https://aitest1.snu.in/api/auth/callback/google`

## Rollback (restore the old static aitest1 site)

```bash
sudo cp /etc/caddy/Caddyfile.bak.<timestamp> /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
cd /home/om/coe3d-src/deploy && docker compose -f docker-compose.yml down
```
