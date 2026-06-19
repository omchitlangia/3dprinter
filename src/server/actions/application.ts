"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requestedDateToInstant, isFutureDay } from "@/lib/dates";
import { applicationLimiter } from "@/lib/ratelimit";
import { createApplicationSchema } from "@/lib/validation";
import { requireUser } from "../auth/guards";
import { sendNewApplicationAdmin } from "../email/send";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Submit a print application. Validates:
 *  - authn (signed-in user)
 *  - rate limit (per user)
 *  - Zod shape (filament enum, positive hours, file key shape/size, 3 distinct days)
 *  - the three requested days are all in the future (server-side)
 *  - ONE active application per user: blocked only if the user already has a
 *    PENDING one. After a decision (approved/rejected) they may submit again.
 *
 * Every submission starts PENDING — there is no auto-confirmation.
 */
export async function createApplication(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();

  const { success } = await applicationLimiter.limit(user.id);
  if (!success) {
    return { ok: false, error: "Too many submissions. Please wait a moment." };
  }

  const parsed = createApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid application" };
  }
  const data = parsed.data;

  // All three requested days must be in the future.
  for (const day of [data.preferredDate, data.altDate1, data.altDate2]) {
    if (!isFutureDay(day)) {
      return { ok: false, error: "All three requested days must be in the future." };
    }
  }

  // One active application per user: block a NEW one only while a PENDING exists.
  const pending = await prisma.application.findFirst({
    where: { userId: user.id, status: "PENDING" },
    select: { id: true },
  });
  if (pending) {
    return {
      ok: false,
      error:
        "You already have an application awaiting review. You can submit a new one after it's approved or rejected.",
    };
  }

  // Persist the applicant's name so it shows in the admin queue and emails.
  // (Magic-link sign-in never captures a name, so the form does.)
  await prisma.user.update({
    where: { id: user.id },
    data: { name: data.name },
  });

  const created = await prisma.application.create({
    data: {
      userId: user.id,
      status: "PENDING",
      filament: data.filament,
      estimatedHours: data.estimatedHours,
      fileKey: data.fileKey,
      fileName: data.fileName,
      fileSize: data.fileSize,
      preferredDate: requestedDateToInstant(data.preferredDate),
      altDate1: requestedDateToInstant(data.altDate1),
      altDate2: requestedDateToInstant(data.altDate2),
    },
  });

  // Notify admins (best-effort; never blocks/rolls back the submission).
  const full = await prisma.application.findUniqueOrThrow({
    where: { id: created.id },
    include: { applicant: true },
  });
  await Promise.allSettled([sendNewApplicationAdmin(full)]);

  revalidatePath("/applications");
  revalidatePath("/admin");
  return { ok: true, data: { id: created.id } };
}
