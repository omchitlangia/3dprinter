import "server-only";

import { render } from "@react-email/components";
import type { Application, User } from "@prisma/client";

import { env } from "@/lib/env";
import { sendMail } from "@/lib/mailer";
import ApplicationApproved from "../../../emails/ApplicationApproved";
import ApplicationRejected from "../../../emails/ApplicationRejected";
import type { ApplicationInfo } from "../../../emails/components/ApplicationDetails";
import NewApplicationAdmin from "../../../emails/NewApplicationAdmin";

const APP_URL = env.NEXTAUTH_URL.replace(/\/$/, "");

function fmtDay(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

type FullApplication = Application & { applicant: User };

function toInfo(a: FullApplication): ApplicationInfo {
  return {
    filament: a.filament,
    estimatedHours: a.estimatedHours,
    fileName: a.fileName,
    preferredDay: fmtDay(a.preferredDate),
    altDay1: fmtDay(a.altDate1),
    altDay2: fmtDay(a.altDate2),
    confirmedDay: a.confirmedDate ? fmtDay(a.confirmedDate) : null,
  };
}

/**
 * All sends are best-effort: a failed email must never roll back a committed
 * mutation. Callers log/ignore the result.
 */
async function safeSend(args: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  try {
    await sendMail({ to: args.to, subject: args.subject, html: args.html });
  } catch (err) {
    console.error("[email] send failed:", args.subject, err);
  }
}

/** New application submitted → all admins ("new application to review"). */
export async function sendNewApplicationAdmin(a: FullApplication): Promise<void> {
  if (env.ADMIN_EMAILS.length === 0) return;
  const html = await render(
    NewApplicationAdmin({
      requesterName: a.applicant.name ?? a.applicant.email,
      requesterEmail: a.applicant.email,
      application: toInfo(a),
      adminUrl: `${APP_URL}/admin`,
    })
  );
  await safeSend({
    to: env.ADMIN_EMAILS,
    subject: "New 3D print application to review",
    html,
  });
}

/** Approved → applicant (confirmed day + filament + hours). */
export async function sendApplicationApproved(a: FullApplication): Promise<void> {
  const html = await render(
    ApplicationApproved({
      userName: a.applicant.name ?? a.applicant.email,
      application: toInfo(a),
      note: a.decisionNote,
      manageUrl: `${APP_URL}/applications`,
    })
  );
  await safeSend({
    to: a.applicant.email,
    subject: "Your 3D print application was approved",
    html,
  });
}

/** Approved → admins (a record copy). */
export async function sendApplicationApprovedAdminCopy(
  a: FullApplication
): Promise<void> {
  if (env.ADMIN_EMAILS.length === 0) return;
  const html = await render(
    NewApplicationAdmin({
      requesterName: a.applicant.name ?? a.applicant.email,
      requesterEmail: a.applicant.email,
      application: toInfo(a),
      adminUrl: `${APP_URL}/admin`,
      approvedCopy: true,
    })
  );
  await safeSend({
    to: env.ADMIN_EMAILS,
    subject: `Approved: ${a.applicant.email}'s print application`,
    html,
  });
}

/** Rejected → applicant (with the reason if given). */
export async function sendApplicationRejected(a: FullApplication): Promise<void> {
  const html = await render(
    ApplicationRejected({
      userName: a.applicant.name ?? a.applicant.email,
      application: toInfo(a),
      reason: a.decisionNote,
      manageUrl: `${APP_URL}/applications`,
    })
  );
  await safeSend({
    to: a.applicant.email,
    subject: "Your 3D print application was not approved",
    html,
  });
}
