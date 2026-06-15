import "server-only";

import { render } from "@react-email/components";

import { sendMail } from "@/lib/mailer";
import MagicLink from "../../../emails/MagicLink";

/**
 * Custom magic-link sender used by the Auth.js email provider's
 * `sendVerificationRequest`. Delivers via Gmail SMTP (Nodemailer) + React Email.
 */
export async function sendMagicLink(params: {
  identifier: string;
  url: string;
}): Promise<void> {
  const { identifier: email, url } = params;
  const host = new URL(url).host;

  const html = await render(MagicLink({ url, host }));

  try {
    await sendMail({
      to: email,
      subject: `Sign in to COE 3D Print`,
      html,
    });
  } catch (err) {
    throw new Error(
      `Failed to send magic-link email: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}
