import { z } from "zod";

/**
 * Centralised, validated environment access. Importing `env` anywhere will
 * throw at module-load time if required vars are missing or malformed, so
 * misconfiguration fails fast rather than at the first request.
 *
 * Secrets are read from `process.env` only — never hardcoded.
 */

const csv = (raw?: string) =>
  (raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const schema = z.object({
  NEXTAUTH_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be set"),

  DATABASE_URL: z.string().min(1),

  // Email — Gmail SMTP via Nodemailer (used for BOTH magic-link sign-in and
  // booking notification emails). Gmail requires the authenticated account in
  // the From header, so EMAIL_FROM must use SMTP_USER's address (display name
  // is fine). SMTP_PASSWORD is the Gmail app password.
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 587))
    .pipe(z.number().int().positive()),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD must be set"),
  EMAIL_FROM: z.string().min(1),

  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_ENDPOINT: z.string().optional(),
  S3_FORCE_PATH_STYLE: z
    .string()
    .optional()
    .transform((v) => v === "true"),

  MAX_UPLOAD_BYTES: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 100 * 1024 * 1024))
    .pipe(z.number().int().positive()),

  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  CRON_SECRET: z.string().min(16, "CRON_SECRET must be set"),

  // Derived (parsed below), not raw env.
  ALLOWED_EMAIL_DOMAINS: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Surface every missing/invalid var at once.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = {
  ...parsed.data,
  ALLOWED_EMAIL_DOMAINS: csv(parsed.data.ALLOWED_EMAIL_DOMAINS),
  ADMIN_EMAILS: csv(parsed.data.ADMIN_EMAILS),
};

/** True when the given email's domain is in the allowlist. */
export function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  // Empty allowlist = deny everyone (fail closed).
  return env.ALLOWED_EMAIL_DOMAINS.includes(domain);
}

/** True when the email is configured as an admin. */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return env.ADMIN_EMAILS.includes(email.toLowerCase());
}
