# Operator runbook — go live with the COE 3D-print app on aitest1.snu.in (bullitt)

Run these **as a user with sudo + docker access** on `bullitt` (`aicoe.snu.in`).
The app lives at `/home/om/coe3d-src`. The session that prepared this had no
docker group and no sudo, so these final steps are manual.

`aitest1.snu.in` → `103.27.166.39` (A, on this box) + `2001:df2:1140:5::87` (AAAA).
**This REPLACES the static site currently served from `/var/www/aitest1`.**

Sign-in is **magic-link only** (no Google). Email goes through **Gmail SMTP**.
Nothing email-related — including login — works until **SMTP_PASSWORD** is set.

---

## STEP 0 — Paste the Gmail App Password (do this first)

Edit `/home/om/coe3d-src/.env` and set `SMTP_PASSWORD` to the Gmail App Password
for `aicoe.3d@gmail.com` (16 chars, no spaces — generate at
https://myaccount.google.com/apppasswords; the account needs 2FA on). Keep the
file `chmod 600`. Everything else in `.env` is already filled with fresh secrets.

```bash
nano /home/om/coe3d-src/.env       # set SMTP_PASSWORD="...."
```

Then confirm Gmail actually delivers to the SNU inbox:

```bash
cd /home/om/coe3d-src
node deploy/verify-smtp.mjs         # sends a test mail to ADMIN_EMAILS (oc233@snu.edu.in)
```

A `RESULT: PASS` plus the test mail arriving (check **spam** too) means login email
will work. If it fails, fix the App Password before going further.

## STEP 1 — Grant docker to `om` (optional; lets future runs skip sudo)

```bash
sudo usermod -aG docker om          # om then re-logs in, or: newgrp docker
```

## STEP 2 — Bring up the private topology

Postgres has **no host port**. MinIO and the app publish to **127.0.0.1 only**
(MinIO 9007, app 3007) so the system Caddy can proxy to them. A `cron` sidecar
POSTs `/api/cron/reminders` every 15 minutes. Migrations + bucket creation are
automatic.

```bash
cd /home/om/coe3d-src/deploy
docker compose --env-file ../.env -f docker-compose.yml up -d --build
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml logs -f app    # ctrl-C once it's listening
```

> **If the Docker build can't reach npmjs / binaries.prisma.sh** (this box's
> network blocks them — `npm ci` or `prisma generate` hangs), build the image
> with the reachable mirror first, then `up` without `--build`:
> ```bash
> cd /home/om/coe3d-src
> docker build \
>   --build-arg NPM_REGISTRY=https://registry.npmmirror.com/ \
>   --build-arg PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma \
>   -t coe3d-coe3d-app .          # image name compose expects: <project>-app
> cd deploy && docker compose --env-file ../.env -f docker-compose.yml up -d
> ```
> Integrity hashes in the lockfile are still verified, so the mirror is safe.

Expected:
- `coe3d-postgres-1`   healthy, **no** published port.
- `coe3d-minio-1`      up, published **only** on `127.0.0.1:9007`.
- `coe3d-migrate-1`    exited 0 (applied `0001_init`).
- `coe3d-createbucket-1` exited 0 (created bucket `coe3d-models`).
- `coe3d-app-1`        up, published **only** on `127.0.0.1:3007`.
- `coe3d-cron-1`       up (logs a line every 15 min).

Local sanity (still private, before Caddy):
```bash
curl -sI http://127.0.0.1:3007/ | head -1            # expect HTTP/1.1 200
curl -s  http://127.0.0.1:9007/minio/health/live -o /dev/null -w '%{http_code}\n'  # 200
```

## STEP 3 — Repoint aitest1.snu.in in the system Caddy

The new site block is `/home/om/coe3d-src/deploy/aitest1.Caddyfile`
(`/coe3d-models/*` → MinIO 9007 full-path-preserved; everything else → app 3007).

```bash
# 3a. Back up the live config FIRST.
sudo cp /etc/caddy/Caddyfile /etc/caddy/Caddyfile.bak.$(date +%F-%H%M%S)

# 3b. Edit /etc/caddy/Caddyfile: find the existing `aitest1.snu.in { ... }` block
#     (a file_server rooted at /var/www/aitest1) and REPLACE that whole block with
#     the contents of deploy/aitest1.Caddyfile. Leave every OTHER site block
#     (aicoe, webui, aitest2, stockdash, ocr, lungrag, ...) untouched.
sudoedit /etc/caddy/Caddyfile

# 3c. Validate — a bad config must not take down the other sites.
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

# 3d. Zero-downtime reload (only if validate passed).
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager | head -5
```

The existing valid cert for `aitest1.snu.in` (ZeroSSL via Caddy's ACME) keeps
serving HTTPS — no new issuance needed.

## STEP 4 — Verify the public pipeline

```bash
cd /home/om/coe3d-src
node deploy/verify-public.mjs        # presigned PUT/GET through the public domain,
                                     # byte-match, cron 401/200, page checks. Cleans up.
```

Then open **https://aitest1.snu.in**, request a magic link as **oc233@snu.edu.in**,
and complete sign-in from the email.

---

## Updating the app later (after editing .env or code)

```bash
cd /home/om/coe3d-src/deploy
docker compose -f docker-compose.yml up -d --build app cron
```

## Rollback — restore the old static aitest1 site

```bash
sudo cp /etc/caddy/Caddyfile.bak.<timestamp> /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
cd /home/om/coe3d-src/deploy && docker compose -f docker-compose.yml down
```
