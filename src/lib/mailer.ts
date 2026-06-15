import "server-only";

import nodemailer from "nodemailer";

import { env } from "./env";

/**
 * Single Gmail SMTP transport used for ALL outbound email — Auth.js magic-link
 * sign-in AND booking confirmation/reminder/status notifications.
 *
 * Gmail on :587 uses STARTTLS (secure=false → upgraded after EHLO). Auth is the
 * Gmail account + an app password (SMTP_PASSWORD). Because Gmail rewrites/ rejects
 * a From that isn't the authenticated account, EMAIL_FROM must use SMTP_USER's
 * address (a display name is allowed, e.g. "AI CoE 3D Print <aicoe.3d@gmail.com>").
 */
export const mailer = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

export const EMAIL_FROM = env.EMAIL_FROM;

/**
 * Send one HTML email. Throws on failure — callers that must not fail the
 * surrounding mutation (booking sends) wrap this; the magic-link sender lets it
 * throw so a delivery failure surfaces as a sign-in error.
 */
export async function sendMail(args: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  await mailer.sendMail({
    from: EMAIL_FROM,
    to: args.to,
    subject: args.subject,
    html: args.html,
  });
}
