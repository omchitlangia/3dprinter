"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { updateStatusSchema, type UpdateStatusInput } from "@/lib/validation";
import { requireAdmin } from "../auth/guards";
import { logAudit } from "../audit";
import { sendBookingStatus } from "../email/send";
import type { ActionResult } from "./booking";

// Status changes that have a user-facing email.
const EMAILED_STATUSES = ["printing", "ready_for_pickup", "cancelled", "rejected"] as const;
type EmailedStatus = (typeof EMAILED_STATUSES)[number];

/**
 * Admin: change a booking's status (any transition in the allowed set) or
 * cancel/reject it. Validates authn + admin authz + Zod, writes an audit entry
 * (actor + timestamp) atomically with the update, and fires the matching email.
 */
export async function adminUpdateStatus(
  input: UpdateStatusInput
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = updateStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }
  const { bookingId, status, reason } = parsed.data;

  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) return { ok: false, error: "Booking not found" };
  if (existing.status === status) {
    return { ok: false, error: "Booking is already in that status" };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.booking.update({
      where: { id: bookingId },
      data: { status },
      include: { printer: true, user: true },
    });
    await logAudit(
      {
        actorId: admin.id,
        bookingId,
        action: "status_change",
        detail: `${existing.status} → ${status}${reason ? ` (reason: ${reason})` : ""}`,
      },
      tx
    );
    return u;
  });

  if ((EMAILED_STATUSES as readonly string[]).includes(status)) {
    await sendBookingStatus(updated, status as EmailedStatus, reason);
  }

  revalidatePath("/admin");
  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  return { ok: true };
}

// ───────────────────────── Printer management ─────────────────────────

const printerStatusSchema = z.object({
  printerId: z.string().cuid(),
  status: z.enum(["available", "maintenance", "offline"]),
});

/** Admin: set a printer's status (available/maintenance/offline). Audited. */
export async function adminSetPrinterStatus(
  input: z.infer<typeof printerStatusSchema>
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = printerStatusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  const printer = await prisma.printer.findUnique({ where: { id: parsed.data.printerId } });
  if (!printer) return { ok: false, error: "Printer not found" };

  await prisma.$transaction(async (tx) => {
    await tx.printer.update({
      where: { id: parsed.data.printerId },
      data: { status: parsed.data.status },
    });
    await logAudit(
      {
        actorId: admin.id,
        action: "printer_status",
        detail: `${printer.name}: ${printer.status} → ${parsed.data.status}`,
      },
      tx
    );
  });

  revalidatePath("/admin");
  return { ok: true };
}

const maintenanceSchema = z
  .object({
    printerId: z.string().cuid(),
    start: z.string().datetime().transform((s) => new Date(s)),
    end: z.string().datetime().transform((s) => new Date(s)),
    reason: z.string().max(300).optional().nullable(),
  })
  .refine((d) => d.end > d.start, { message: "End must be after start" });

/** Admin: add a maintenance window. Audited. */
export async function adminAddMaintenance(
  input: unknown
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const parsed = maintenanceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }
  const { printerId, start, end, reason } = parsed.data;

  const printer = await prisma.printer.findUnique({ where: { id: printerId } });
  if (!printer) return { ok: false, error: "Printer not found" };

  await prisma.$transaction(async (tx) => {
    await tx.maintenanceWindow.create({
      data: { printerId, start, end, reason: reason ?? null },
    });
    await logAudit(
      {
        actorId: admin.id,
        action: "maintenance_add",
        detail: `${printer.name}: ${start.toISOString()} → ${end.toISOString()}`,
      },
      tx
    );
  });

  revalidatePath("/admin");
  return { ok: true };
}
