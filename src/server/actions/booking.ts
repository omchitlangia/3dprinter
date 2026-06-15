"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { bookingLimiter } from "@/lib/ratelimit";
import { cancelBookingSchema, createBookingSchema } from "@/lib/validation";
import { requireUser } from "../auth/guards";
import {
  computeEnd,
  isSlotAvailable,
  withinOperatingWindow,
} from "../booking/scheduling";
import {
  sendBookingConfirmed,
  sendBookingStatus,
  sendNewBookingAdmin,
} from "../email/send";

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/**
 * Create a booking (hybrid submit-then-schedule, auto-confirm). Validates:
 *  - authn (signed-in user)
 *  - rate limit (per user)
 *  - Zod shape (incl. future start, file key shape, size cap)
 *  - printer exists + is available + material/color compatible
 *  - within operating window
 *  - no overlap with active booking or maintenance window (re-checked inside
 *    the transaction to close the race window)
 */
export async function createBooking(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();

  const { success } = await bookingLimiter.limit(user.id);
  if (!success) {
    return { ok: false, error: "Too many booking attempts. Please wait a moment." };
  }

  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking" };
  }
  const data = parsed.data;
  const end = computeEnd(data.start, data.estimatedDuration);

  const printer = await prisma.printer.findUnique({ where: { id: data.printerId } });
  if (!printer) return { ok: false, error: "Printer not found" };
  if (printer.status !== "available") {
    return { ok: false, error: "Printer is not currently available" };
  }
  if (!printer.materials.includes(data.material)) {
    return { ok: false, error: "Selected printer doesn't support that material" };
  }
  if (printer.colors.length > 0 && !printer.colors.includes(data.color)) {
    return { ok: false, error: "Selected printer doesn't have that color" };
  }
  if (!withinOperatingWindow(printer, data.start, end)) {
    return { ok: false, error: "Time is outside the printer's operating hours" };
  }

  let bookingId: string;
  try {
    const created = await prisma.$transaction(async (tx) => {
      // Re-check availability inside the transaction to guard against two
      // concurrent bookings claiming the same slot.
      const free = await isSlotAvailable(tx, {
        printerId: data.printerId,
        start: data.start,
        end,
      });
      if (!free) {
        throw new Error("SLOT_TAKEN");
      }
      return tx.booking.create({
        data: {
          userId: user.id,
          printerId: data.printerId,
          status: "confirmed",
          start: data.start,
          estimatedDuration: data.estimatedDuration,
          endsAt: end,
          material: data.material,
          color: data.color,
          notes: data.notes ?? null,
          fileKey: data.fileKey,
          fileName: data.fileName,
          fileSize: data.fileSize,
        },
      });
    });
    bookingId = created.id;
  } catch (err) {
    if (err instanceof Error && err.message === "SLOT_TAKEN") {
      return {
        ok: false,
        error: "That slot just got taken. Please pick another time.",
      };
    }
    throw err;
  }

  // Fire emails after commit (best-effort, never blocks/rolls back the booking).
  const full = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { printer: true, user: true },
  });
  await Promise.allSettled([
    sendBookingConfirmed(full),
    sendNewBookingAdmin(full),
  ]);

  revalidatePath("/bookings");
  revalidatePath("/admin");
  return { ok: true, data: { id: bookingId } };
}

/**
 * Owner-or-admin cancel. A user may cancel their own booking; admins may cancel
 * any (admin cancels are audit-logged in the admin action). Cannot cancel a
 * terminal booking.
 */
export async function cancelOwnBooking(input: {
  bookingId: string;
  reason?: string | null;
}): Promise<ActionResult> {
  const user = await requireUser();

  const parsed = cancelBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { printer: true, user: true },
  });
  if (!booking) return { ok: false, error: "Booking not found" };

  // Owner-or-admin authorization.
  if (booking.userId !== user.id && user.role !== "admin") {
    return { ok: false, error: "Not allowed" };
  }
  if (["completed", "cancelled", "rejected"].includes(booking.status)) {
    return { ok: false, error: "Booking can no longer be cancelled" };
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "cancelled" },
    include: { printer: true, user: true },
  });

  await sendBookingStatus(updated, "cancelled", parsed.data.reason);

  revalidatePath("/bookings");
  revalidatePath("/admin");
  return { ok: true };
}
