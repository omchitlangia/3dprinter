import "server-only";

import { render } from "@react-email/components";

import { EMAIL_FROM, resend } from "@/lib/resend";
import MagicLink from "../../../emails/MagicLink";

/**
 * Custom magic-link sender used by the Auth.js email (Nodemailer) provider's
 * `sendVerificationRequest`. Delivers via Resend + React Email instead of SMTP.
 */
export async function sendMagicLink(params: {
  identifier: string;
  url: string;
}): Promise<void> {
  const { identifier: email, url } = params;
  const host = new URL(url).host;

  const html = await render(MagicLink({ url, host }));

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Sign in to COE 3D Print`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send magic-link email: ${error.message}`);
  }
}
