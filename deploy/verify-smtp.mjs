// Sends ONE test email to ADMIN_EMAILS using the SMTP_* settings in ../.env.
// The operator runs this AFTER pasting the Gmail App Password into SMTP_PASSWORD,
// to confirm Gmail actually delivers to the @snu.edu.in inbox (check spam too).
//
//   cd /home/om/coe3d-src && node deploy/verify-smtp.mjs
//
// Exit 0 = Gmail accepted the message for delivery. Then check the inbox.

import { readFileSync } from "node:fs";
import nodemailer from "nodemailer";

// ---- load ../.env (minimal parser, same approach as the app) ----
const envText = readFileSync(new URL("../.env", import.meta.url), "utf8");
const E = {};
for (const line of envText.split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  E[m[1]] = v;
}

const need = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM", "ADMIN_EMAILS"];
const missing = need.filter((k) => !E[k]);
if (missing.length) {
  console.error("MISSING in .env:", missing.join(", "));
  if (missing.includes("SMTP_PASSWORD")) {
    console.error("\n→ Paste the Gmail App Password into SMTP_PASSWORD in .env first.");
  }
  process.exit(2);
}

const to = E.ADMIN_EMAILS.split(",").map((s) => s.trim()).filter(Boolean);
const port = Number(E.SMTP_PORT);

const transport = nodemailer.createTransport({
  host: E.SMTP_HOST,
  port,
  secure: port === 465, // 465 implicit TLS; 587 STARTTLS
  auth: { user: E.SMTP_USER, pass: E.SMTP_PASSWORD },
});

console.log(`SMTP   : ${E.SMTP_USER}@${E.SMTP_HOST}:${port}`);
console.log(`From   : ${E.EMAIL_FROM}`);
console.log(`To     : ${to.join(", ")}`);

try {
  // verify() does the SMTP handshake + auth without sending — catches a bad
  // app password up front with a clear error.
  await transport.verify();
  console.log("Auth   : OK (handshake + login succeeded)");

  const info = await transport.sendMail({
    from: E.EMAIL_FROM,
    to,
    subject: "COE 3D Print — SMTP test ✅",
    text:
      "This is a test from deploy/verify-smtp.mjs.\n\n" +
      "If you received this, Gmail SMTP delivery works and magic-link sign-in " +
      "will send. You can now complete the go-live steps.\n",
    html:
      "<p>This is a test from <code>deploy/verify-smtp.mjs</code>.</p>" +
      "<p>If you received this, <b>Gmail SMTP delivery works</b> and magic-link " +
      "sign-in will send. You can now complete the go-live steps.</p>",
  });

  console.log("Sent   : messageId", info.messageId);
  console.log("Accepted:", info.accepted?.join(", ") || "(none)");
  if (info.rejected?.length) console.log("Rejected:", info.rejected.join(", "));
  console.log("\nRESULT : PASS — now check the inbox (and SPAM) for", to.join(", "));
  process.exit(0);
} catch (err) {
  console.error("\nRESULT : FAIL —", err?.message || err);
  console.error(
    "Common causes: wrong/blank App Password, 2FA not enabled on the Gmail " +
      "account, or 'less secure app' restrictions. Regenerate the App Password " +
      "at https://myaccount.google.com/apppasswords"
  );
  process.exit(1);
}
