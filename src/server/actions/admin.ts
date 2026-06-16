"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  approveApplicationSchema,
  rejectApplicationSchema,
  type ApproveApplicationInput,
  type RejectApplicationInput,
} from "@/lib/validation";
import { requireAdmin } from "../auth/guards";
import {
  sendApplicationApproved,
  sendApplicationApprovedAdminCopy,
  sendApplicationRejected,
} from "../email/send";
import type { ActionResult } from "./application";

/**
 * Admin: approve an application by confirming WHICH of the applicant's three
 * requested days to use (default = preferred). Never invents a date. Sets
 * status APPROVED + confirmedDate, records decidedBy + decidedAt, and emails
 * the applicant (with a copy to the admins).
 */
export async function adminApprove(
  input: ApproveApplicationInput
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = approveApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }
  const { applicationId, slot, note } = parsed.data;

  const existing = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!existing) return { ok: false, error: "Application not found" };
  if (existing.status !== "PENDING") {
    return { ok: false, error: "Only a pending application can be approved." };
  }

  // Pick the confirmed day from the applicant's own three requested days.
  const confirmedDate =
    slot === "alt1"
      ? existing.altDate1
      : slot === "alt2"
        ? existing.altDate2
        : existing.preferredDate;

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: "APPROVED",
      confirmedDate,
      decisionNote: note ?? null,
      decidedById: admin.id,
      decidedAt: new Date(),
    },
    include: { applicant: true },
  });

  await Promise.allSettled([
    sendApplicationApproved(updated),
    sendApplicationApprovedAdminCopy(updated),
  ]);

  revalidatePath("/admin");
  revalidatePath("/applications");
  return { ok: true };
}

/**
 * Admin: reject an application with an optional reason. Sets status REJECTED,
 * records decidedBy + decidedAt, and emails the applicant (with the reason if
 * given).
 */
export async function adminReject(
  input: RejectApplicationInput
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = rejectApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }
  const { applicationId, reason } = parsed.data;

  const existing = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!existing) return { ok: false, error: "Application not found" };
  if (existing.status !== "PENDING") {
    return { ok: false, error: "Only a pending application can be rejected." };
  }

  const updated = await prisma.application.update({
    where: { id: applicationId },
    data: {
      status: "REJECTED",
      decisionNote: reason ?? null,
      decidedById: admin.id,
      decidedAt: new Date(),
    },
    include: { applicant: true },
  });

  await Promise.allSettled([sendApplicationRejected(updated)]);

  revalidatePath("/admin");
  revalidatePath("/applications");
  return { ok: true };
}
