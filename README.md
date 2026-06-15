# COE 3D Print Booking

A 3D-printing booking app for the **AI Center of Excellence, Shiv Nadar University**.

Users submit a model file + print settings, pick a free slot on a compatible
printer, and get auto-confirmed. Admins manage bookings and printers from a
dashboard. Email notifications fire at every step.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix primitives)
- **Auth.js v5** (NextAuth) — Google OAuth + email magic-link
- **Prisma** + **PostgreSQL**
- **Resend** + **React Email**
- **Zod** for validation
- **Upstash Redis** for distributed rate limiting (optional; in-memory fallback)
- **S3-compatible object storage** (AWS S3 / Cloudflare R2 / MinIO) via presigned uploads

---

## Core flow (hybrid submit-then-schedule)

1. An authenticated user **submits** a job: uploads a model file (`.stl/.3mf/.obj`)
   and chooses material, color, estimated duration, and notes. The file uploads
   **directly to object storage** via a presigned URL — it never touches the app
   server or the database.
2. The user **picks a start time** on a compatible, available printer. The server
   rejects any interval that overlaps an existing active booking or a maintenance
   window on that printer, or falls outside the printer's operating hours.
3. The booking **auto-confirms**. Admins can change status or cancel any booking.

**Lifecycle:** `confirmed → printing → ready_for_pickup → completed`, plus
`cancelled` / `rejected`.

---

## Project layout

```
prisma/
  schema.prisma            # User / Printer / Booking / MaintenanceWindow / AuditLog + Auth.js tables
  migrations/              # SQL migrations (0001_init)
  seed.ts                  # seeds admins (from env) + example printers
emails/                    # React Email templates
src/
  app/
    book/                  # submit → schedule wizard
    bookings/              # "my bookings" list + detail (owner cancel)
    admin/                 # dashboard (list/filter/status/cancel) + printers/maintenance
    signin/                # sign-in, verify, error pages
    api/auth/[...nextauth] # Auth.js route handler
    api/cron/reminders     # POST-only, shared-secret-protected reminder endpoint
  components/ui/           # shadcn/ui primitives
  lib/                     # env, prisma, ratelimit, uploads, validation, format, utils
  server/
    auth/                  # Auth.js config + guards (requireUser/requireAdmin)
    actions/               # server actions (booking, admin, upload, download, availability)
    booking/scheduling.ts  # overlap + operating-window + compatibility logic
    email/                 # send logic + magic-link sender
    storage/s3.ts          # presigned upload/download
    audit.ts               # admin-override audit logging
  middleware.ts            # route gating (session presence)
next.config.mjs            # security headers (CSP, HSTS, X-Frame-Options, …)
.github/workflows/         # reminders-cron.yml (POSTs the reminder endpoint every 15m)
```

---

## Environment variables

Copy `.env.example` to `.env` and fill these in. **Every secret comes from env —
nothing is hardcoded.** The app validates all of these at startup (`src/lib/env.ts`)
and fails fast if any required one is missing or malformed.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXTAUTH_URL` | ✅ | — | Public base URL (used by Auth.js callbacks + email links). |
| `AUTH_SECRET` | ✅ | — | Session/JWT signing secret. `openssl rand -base64 32`. |
| `DATABASE_URL` | ✅ | — | Postgres connection string. |
| `AUTH_GOOGLE_ID` | ✅ | — | Google OAuth client ID. |
| `AUTH_GOOGLE_SECRET` | ✅ | — | Google OAuth client secret. |
| `ALLOWED_EMAIL_DOMAINS` | ✅ | — | Comma-separated allowed email domains. Sign-ins from other domains are **rejected** (Google + magic-link). Empty = deny all. |
| `ADMIN_EMAILS` | ✅ | — | Comma-separated admin emails. Granted/synced the admin role on sign-in and seeded by `db:seed`. |
| `RESEND_API_KEY` | ✅ | — | Resend API key. |
| `EMAIL_FROM` | ✅ | — | Verified sender, e.g. `COE 3D Print <noreply@coe.snu.edu.in>`. |
| `S3_REGION` | ✅ | `auto` | Storage region (`auto` for R2). |
| `S3_BUCKET` | ✅ | — | Bucket name. |
| `S3_ACCESS_KEY_ID` | ✅ | — | Storage access key. |
| `S3_SECRET_ACCESS_KEY` | ✅ | — | Storage secret key. |
| `S3_ENDPOINT` | ⬜ | — | Custom endpoint for R2/MinIO. Omit for plain AWS S3. |
| `S3_FORCE_PATH_STYLE` | ⬜ | `false` | `true` for MinIO / path-style addressing. |
| `MAX_UPLOAD_BYTES` | ⬜ | `104857600` (100 MB) | Hard upload size cap, enforced client-side, in Zod, and at the storage layer. |
| `UPSTASH_REDIS_REST_URL` | ⬜ | — | Upstash Redis REST URL for distributed rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | ⬜ | — | Upstash Redis REST token. |
| `CRON_SECRET` | ✅ | — | Shared bearer secret the cron caller must present to the reminder endpoint. `openssl rand -hex 32`. |

> **Rate limiting:** if `UPSTASH_REDIS_*` are unset, an **in-memory** limiter is
> used. That is fine for dev / a single instance but does **not** share state
> across serverless instances — set Upstash in production.

---

## Infrastructure to provision

1. **PostgreSQL database** — managed (Neon, Supabase, RDS, Railway) or self-hosted.
   Set `DATABASE_URL`.
2. **Object storage bucket** (S3-compatible) — AWS S3, Cloudflare R2, or MinIO.
   - Keep the bucket **private** (no public read). Files are served via short-lived
     presigned URLs only.
   - Configure **CORS** to allow browser `PUT` (upload) and `GET` (download) from
     your app origin. Example CORS rule:
     ```json
     [
       {
         "AllowedOrigins": ["https://print.coe.snu.edu.in"],
         "AllowedMethods": ["PUT", "GET"],
         "AllowedHeaders": ["content-type"],
         "MaxAgeSeconds": 3000
       }
     ]
     ```
   - Set `S3_*` vars. Optionally set a lifecycle rule to expire old uploads.
3. **Google OAuth credentials** — create an OAuth client in Google Cloud Console.
   Authorized redirect URI: `https://<your-domain>/api/auth/callback/google`.
   Set `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
4. **Resend account** — verify your sending domain, create an API key. Set
   `RESEND_API_KEY` and `EMAIL_FROM` (the from-address must be on the verified domain).
5. **Upstash Redis** (recommended for prod) — create a Redis database, set
   `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
6. **Cron scheduler** — something that **POSTs** `/api/cron/reminders` every
   ~15 minutes with `Authorization: Bearer $CRON_SECRET`. A ready-made GitHub
   Actions workflow is in `.github/workflows/reminders-cron.yml`
   (set repo secrets `APP_URL` and `CRON_SECRET`). Upstash QStash or any external
   cron works too.
7. **Hosting** — Vercel, Fly.io, a container, etc. Set all env vars there.

---

## Local development

You need a Postgres database and an S3-compatible bucket. The quickest local
setup uses Docker for both:

```bash
# Postgres on :5433
docker run -d --name coe3d-pg \
  -e POSTGRES_USER=coe -e POSTGRES_PASSWORD=coe -e POSTGRES_DB=coe3d \
  -p 5433:5432 postgres:16-alpine

# MinIO (S3-compatible) on :9000, console :9001
docker run -d --name coe3d-minio \
  -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin \
  -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"
# create the bucket (one-off)
docker run --rm --network host --entrypoint sh minio/mc -c \
  'mc alias set local http://localhost:9000 minioadmin minioadmin && mc mb -p local/coe-3d-uploads'
```

Then:

```bash
# 1. install deps
npm install

# 2. configure env (point DATABASE_URL at :5433 and S3_* at the MinIO above;
#    set S3_ENDPOINT=http://localhost:9000 and S3_FORCE_PATH_STYLE=true)
cp .env.example .env   # then edit

# 3. set up the database (creates tables from migrations)
npm run db:deploy      # or `npm run db:migrate` for a dev migration
npm run db:generate    # generate the Prisma client (also runs in `build`)

# 4. seed admins + example printers
npm run db:seed

# 5. run
npm run dev            # → http://localhost:3000
```

> **`NEXTAUTH_URL` must match the port you actually serve on.** If port 3000 is
> taken and Next falls back to another port, update `NEXTAUTH_URL` (or pin the
> port with `PORT=3000 npm run dev`) — otherwise auth callbacks break.

Other scripts:

```bash
npm run build          # prisma generate + next build
npm run typecheck      # tsc --noEmit
npm run lint
npm run email:dev      # preview React Email templates
```

---

## Emails

Sent via Resend + React Email (`emails/`). Fired on:

- **Booking confirmed** → user, **and** a new-booking notice → all admins.
- **Reminders** — 24h-before and 1h-before, driven by the cron reminder endpoint.
  Idempotent: each window flips a `reminderXSent` flag so retries never double-send.
- **Status changes** — printing started, ready for pickup, cancelled, rejected.

All sends are best-effort and never roll back a committed booking.

---

## Security

Maps to the acceptance criteria:

- **Validation + authz on every mutation.** All server actions validate input
  with **Zod** and check **authn + authz** (owner-or-admin; admin-only for
  overrides). See `src/server/actions/*` and `src/server/auth/guards.ts`.
- **Auth allowlist.** Sign-ins (Google *and* magic-link) are rejected unless the
  email domain is in `ALLOWED_EMAIL_DOMAINS`. Admins are seeded/synced from
  `ADMIN_EMAILS`.
- **Uploads.** Allowlist `.stl/.3mf/.obj`, verify declared MIME against a per-extension
  allowlist, enforce a size cap (`MAX_UPLOAD_BYTES`, default 100 MB) in the client,
  in Zod, and on the presigned PUT (signed `content-type` + `content-length`).
  Files go **straight to object storage** via presigned URLs — never the DB or app
  server. Downloads use short-lived presigned GET URLs gated by owner-or-admin authz.
- **Rate limiting.** Booking creation (5/min/user), magic-link requests (3/10min/email),
  and presign requests (20/min/user). Distributed via Upstash when configured.
- **Booking conflicts.** Overlap with active bookings or maintenance windows is
  rejected, re-checked **inside the DB transaction** to close the race window.
- **Secrets via env only.** Validated at startup; nothing hardcoded.
- **No mutating GET routes.** The reminder endpoint is **POST-only** and protected
  by a constant-time shared-secret check. All mutations are server actions (POST).
- **Security headers** in `next.config.mjs`: CSP, HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- **Audit log.** Every admin override (status change, cancel/reject, printer status,
  maintenance) records actor + timestamp in `AuditLog`, written atomically with the
  mutation.

---

## Notes & assumptions

- Times are handled in **IST (Asia/Kolkata)** for display, operating-window checks,
  and reminders. Stored as UTC in Postgres.
- Printer **operating windows** are a simple daily `[openMinute, closeMinute)`;
  bookings must fit within a single operating day (no overnight spanning).
- Material/color **compatibility** is modeled as string arrays on each printer;
  scheduling only offers `available` printers that match the requested material
  (and color, when the printer declares colors).
- **Auth hosting:** `trustHost: true` is set so the app works self-hosted / behind
  a reverse proxy (the canonical origin is pinned by `NEXTAUTH_URL`). Required in
  production outside Vercel.
- The **magic-link** provider is a custom Auth.js `"email"` provider that delivers
  via Resend — there is intentionally **no SMTP/nodemailer dependency**. The domain
  allowlist + rate limit run before any email is sent.
- **Browser uploads need CORS** on the bucket (PUT) and downloads (GET) from your app
  origin — see the CORS rule under "Infrastructure to provision". MinIO local dev:
  CORS is permissive by default.

## Verified during testing

Brought up against real Postgres + MinIO and exercised end-to-end:

- Route gating: public pages 200; `/book` & `/admin` redirect anonymous users;
  non-admin redirected away from `/admin`; admin allowed.
- Magic-link: disallowed domain → `AccessDenied`; allowed domain reaches the Resend
  sender (needs a real key to actually deliver).
- Presigned upload **and** download round-trip against MinIO (bytes match).
- Booking rules: overlap rejected (exact, partial, adjacent-OK at boundary),
  maintenance-window block, operating-hours enforcement, material/color compat,
  Zod rejection of bad file keys / past start / oversize.
- **Concurrency:** two simultaneous bookings for the same slot → exactly one wins
  (in-transaction recheck).
- Admin status change writes an **audit log** (actor + before→after) atomically.
- Cron reminder endpoint: 401 without secret, 405 on GET, 200 + idempotent flag on
  authorized POST.
- Security headers present on every response; production build clean (`next build`,
  `tsc --noEmit`, `next lint` all pass).
